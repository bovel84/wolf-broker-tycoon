/*
 * immersive-engine.js
 * Immersive Core: inbox, luoghi, conversazioni, scelte e orchestrazione LLM.
 * Stato persistente sotto gameState.narrative.immersive.
 * ES5-safe.
 */
(function (global) {
	var VERSION = "1.0.0";
	var engine = null;
	var installed = false;
	var sequence = 0;
	var processingWeeks = {};
	var MAX_MESSAGES = 80;
	var MAX_CONVERSATION_ENTRIES = 60;

	function clamp(v, min, max) {
		return Math.max(min, Math.min(max, Number(v) || 0));
	}
	function safe(v, max) {
		return String(v == null ? "" : v)
			.replace(/[<>]/g, "")
			.substring(0, max || 500);
	}
	function slug(v) {
		return (
			safe(v || "unknown", 100)
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "_")
				.replace(/^_+|_+$/g, "") || "unknown"
		);
	}
	function uid(prefix) {
		sequence++;
		return (
			(prefix || "imm") +
			"_" +
			Date.now().toString(36) +
			"_" +
			sequence.toString(36)
		);
	}
	function copy(obj) {
		if (obj == null || typeof obj !== "object") return obj;
		if (obj instanceof Array) {
			var arr = [];
			for (var i = 0; i < obj.length; i++) arr.push(copy(obj[i]));
			return arr;
		}
		var out = {};
		for (var k in obj) if (Object.hasOwn(obj, k)) out[k] = copy(obj[k]);
		return out;
	}
	function weekKey(state) {
		var p = state && state.player ? state.player : {};
		return String(p.year || 1) + ":" + String(p.week || 1);
	}
	function getCareerState() {
		try {
			if (global.G && global.G.brokerCareer) return global.G.brokerCareer;
		} catch (e) {}
		return null;
	}
	function getCareerContext() {
		try {
			if (global.BrokerageCareer && global.BrokerageCareer.getContext)
				return global.BrokerageCareer.getContext();
		} catch (e) {}
		return null;
	}
	function getNarrativeEngine() {
		return global.LLMNarrativeEngine || null;
	}
	function ensureNarrative(state) {
		var narrativeEngine = getNarrativeEngine();
		if (narrativeEngine && narrativeEngine.ensureNarrativeState)
			return narrativeEngine.ensureNarrativeState(state);
		if (!state.narrative || typeof state.narrative !== "object") {
			state.narrative = {
				characters: {},
				events: [],
				relationships: {},
				memories: [],
				companyLore: {},
				lastGeneratedWeek: 0,
			};
		}
		if (!state.narrative.characters) state.narrative.characters = {};
		if (!state.narrative.events) state.narrative.events = [];
		if (!state.narrative.relationships) state.narrative.relationships = {};
		if (!state.narrative.memories) state.narrative.memories = [];
		return state.narrative;
	}
	function createImmersiveState() {
		return {
			version: VERSION,
			messages: [],
			locations: [],
			conversations: {},
			interactions: {},
			lastProcessedWeek: "",
			activeLocation: "desk",
			llmStatus: "fallback",
			llmLastError: "",
			stats: { messagesRead: 0, choicesMade: 0, conversationsStarted: 0 },
		};
	}
	function ensureState(state) {
		if (!state) return null;
		var narrative = ensureNarrative(state);
		if (!narrative.immersive || typeof narrative.immersive !== "object")
			narrative.immersive = createImmersiveState();
		var im = narrative.immersive;
		if (!(im.messages instanceof Array)) im.messages = [];
		if (!(im.locations instanceof Array)) im.locations = [];
		if (!im.conversations || typeof im.conversations !== "object")
			im.conversations = {};
		if (!im.interactions || typeof im.interactions !== "object")
			im.interactions = {};
		if (!im.stats)
			im.stats = { messagesRead: 0, choicesMade: 0, conversationsStarted: 0 };
		if (!im.lastProcessedWeek) im.lastProcessedWeek = "";
		if (!im.activeLocation) im.activeLocation = "desk";
		if (!im.llmStatus) im.llmStatus = "fallback";
		return im;
	}
	function currentState() {
		return engine && engine.getState ? engine.getState() : null;
	}
	function careerSpeaker() {
		var ctx = getCareerContext();
		if (!ctx)
			return {
				id: "management:wall_street",
				name: "Direzione del Desk",
				role: "Management",
			};
		var name =
			ctx.status === "owner" && ctx.ownFirm
				? ctx.ownFirm.name
				: ctx.employer || "Direzione del Desk";
		return {
			id: "management:" + slug(name),
			name: name,
			role: ctx.status === "owner" ? "Board della tua societa" : "Management",
		};
	}
	function characterFromColleague(colleague) {
		return {
			id: "colleague:" + slug(colleague.id || colleague.name),
			name: safe(colleague.name, 80),
			namespace: "colleague",
			role: colleague.role || "Collega di desk",
			archetype:
				colleague.politics > 70
					? "politico"
					: colleague.ethics < 35
						? "opportunista"
						: "ambizioso",
			traits: [
				colleague.ambition > 70 ? "ambizioso" : "prudente",
				colleague.ethics > 65 ? "leale" : "spregiudicato",
			],
			backstory:
				"Condivide il desk, i target e la pressione della classifica interna.",
			currentMood:
				colleague.relationship > 60
					? "collaborativo"
					: colleague.relationship < 35
						? "ostile"
						: "vigile",
			currentGoal: colleague.lastMove || "Superarti nella classifica interna.",
			memory: [],
			relationships: {},
			stats: {
				trust: clamp(colleague.relationship, 0, 100),
				fear: 0,
				respect: clamp(colleague.score || 50, 0, 100),
				affection: 0,
				suspicion: clamp(colleague.politics || 40, 0, 100),
			},
			createdWeek: 1,
			lastSeenWeek: 1,
			active: true,
		};
	}
	function ensureCharacters(state) {
		var narrative = ensureNarrative(state);
		var narrativeEngine = getNarrativeEngine();
		if (narrativeEngine && narrativeEngine.ensureKeyCharacters) {
			try {
				narrativeEngine.ensureKeyCharacters(state);
			} catch (e) {}
		}
		var management = careerSpeaker();
		if (!narrative.characters[management.id]) {
			narrative.characters[management.id] = {
				id: management.id,
				name: management.name,
				namespace: "management",
				role: management.role,
				archetype: "istituzionale",
				traits: ["esigente", "strategico"],
				backstory:
					"Il vertice che controlla target, rischio, reputazione e futuro professionale.",
				currentMood: "vigile",
				currentGoal: "Proteggere risultati e reputazione del desk.",
				memory: [],
				relationships: {},
				stats: { trust: 50, fear: 0, respect: 55, affection: 0, suspicion: 30 },
				createdWeek: state.player ? state.player.week : 1,
				lastSeenWeek: state.player ? state.player.week : 1,
				active: true,
			};
		}
		var career = getCareerState();
		var colleagues = career && career.colleagues ? career.colleagues : [];
		for (var i = 0; i < colleagues.length; i++) {
			var c = characterFromColleague(colleagues[i]);
			var existing = narrative.characters[c.id];
			if (!existing) narrative.characters[c.id] = c;
			else {
				existing.currentMood = c.currentMood;
				existing.currentGoal = c.currentGoal;
				existing.stats.trust = c.stats.trust;
				existing.lastSeenWeek = state.player ? state.player.week : 1;
				existing.active = true;
			}
		}
		var ownStaff =
			career && career.ownFirm && career.ownFirm.staff
				? career.ownFirm.staff
				: [];
		for (var j = 0; j < ownStaff.length; j++) {
			var staff = ownStaff[j];
			var staffId = "staff:" + slug(staff.id || staff.name);
			if (!narrative.characters[staffId]) {
				narrative.characters[staffId] = {
					id: staffId,
					name: safe(staff.name, 80),
					namespace: "staff",
					role: "Broker della tua societa",
					archetype: staff.ethics > 60 ? "leale" : "opportunista",
					traits: [
						staff.skill > 70 ? "talentuoso" : "tenace",
						staff.ethics > 60 ? "etico" : "aggressivo",
					],
					backstory:
						"Lavora per la societa che hai fondato e giudica ogni tua decisione.",
					currentMood: "vigile",
					currentGoal: "Crescere insieme alla societa.",
					memory: [],
					relationships: {},
					stats: {
						trust: 50,
						fear: 0,
						respect: clamp(staff.skill, 0, 100),
						affection: 0,
						suspicion: 20,
					},
					createdWeek: state.player ? state.player.week : 1,
					lastSeenWeek: state.player ? state.player.week : 1,
					active: true,
				};
			}
		}
		return narrative.characters;
	}
	function buildLocations(state) {
		var ctx = getCareerContext();
		var career = getCareerState();
		var management = careerSpeaker();
		var locations = [
			{
				id: "desk",
				icon: "📈",
				title: "Trading Floor",
				description:
					"Telefoni, monitor e ambizione. Qui ogni risultato diventa reputazione.",
				atmosphere: ctx ? ctx.employerMood || "vigile" : "elettrico",
				accessible: true,
				occupants: [management.id],
			},
			{
				id: "corridor",
				icon: "🚪",
				title: "Corridoio",
				description: "Gossip, alleanze e mezze verita lontano dai terminali.",
				atmosphere: "sospeso",
				accessible: true,
				occupants: [],
			},
			{
				id: "meeting-room",
				icon: "🗂️",
				title: "Sala Riunioni",
				description:
					"Target, audit, strategie e responsabilita vengono messi sul tavolo.",
				atmosphere: "teso",
				accessible: !!ctx,
				occupants: [management.id],
			},
			{
				id: "ceo-office",
				icon: "🏙️",
				title: "Ufficio Direzione",
				description:
					"Una stanza dove carriera, fiducia e potere cambiano in poche frasi.",
				atmosphere: "formale",
				accessible: !!ctx,
				occupants: [management.id],
			},
			{
				id: "assembly-foyer",
				icon: "🏛️",
				title: "Foyer Assemblea",
				description:
					"CEO, azionisti e consulenti preparano pressioni prima del voto.",
				atmosphere: "politico",
				accessible: !!(
					state.market &&
					state.market.assembliesThisWeek &&
					state.market.assembliesThisWeek.length
				),
				occupants: [],
			},
		];
		var colleagues = career && career.colleagues ? career.colleagues : [];
		for (var i = 0; i < colleagues.length; i++) {
			var id = "colleague:" + slug(colleagues[i].id || colleagues[i].name);
			locations[0].occupants.push(id);
			if (i % 2 === 0) locations[1].occupants.push(id);
			else locations[2].occupants.push(id);
		}
		if (ctx && ctx.status === "owner") {
			locations.push({
				id: "own-office",
				icon: "🐺",
				title: "Ufficio del Fondatore",
				description:
					"Liquidita, compliance, clienti e staff: qui la societa dipende da te.",
				atmosphere: "ambizioso",
				accessible: true,
				occupants: [management.id],
			});
		}
		ensureState(state).locations = locations;
		return locations;
	}
	function findLocation(state, id) {
		var locations = buildLocations(state);
		for (var i = 0; i < locations.length; i++)
			if (locations[i].id === id) return locations[i];
		return null;
	}
	function addMessage(state, data) {
		var im = ensureState(state);
		var message = {
			id: data.id || uid("msg"),
			week: state.player ? state.player.week : 1,
			year: state.player ? state.player.year : 1,
			source: data.source || "fallback",
			senderId: data.senderId || "system:market",
			senderName: safe(data.senderName || "Mercato", 90),
			senderRole: safe(data.senderRole || "", 90),
			type: data.type || "system",
			locationId: data.locationId || "desk",
			title: safe(data.title || "Messaggio", 140),
			text: safe(data.text || "", 900),
			mood: safe(data.mood || "neutrale", 40),
			read: !!data.read,
			resolved: !!data.resolved,
			choices: normalizeChoices(
				data.choices || [],
				data.senderId || "system:market",
			),
			chosenChoiceId: data.chosenChoiceId || "",
			outcomeText: safe(data.outcomeText || "", 500),
		};
		im.messages.unshift(message);
		if (im.messages.length > MAX_MESSAGES)
			im.messages = im.messages.slice(0, MAX_MESSAGES);
		return message;
	}
	function normalizeEffects(raw) {
		raw = raw || {};
		return {
			ethics: clamp(raw.ethics, -8, 8),
			reputation: clamp(raw.reputation, -8, 8),
			cash: clamp(raw.cash, -10000, 10000),
			xp: clamp(raw.xp, -100, 200),
			employerTrust: clamp(raw.employerTrust, -10, 10),
			relationship: clamp(raw.relationship, -12, 12),
		};
	}
	function normalizeChoices(choices, senderId) {
		var out = [];
		for (var i = 0; i < choices.length && i < 4; i++) {
			var choice = choices[i] || {};
			out.push({
				id: safe(choice.id || "choice_" + i, 40),
				label: safe(choice.label || choice.text || "Risposta " + (i + 1), 140),
				tone: safe(choice.tone || "neutrale", 30),
				reply: safe(
					choice.reply || choice.outcome || "La conversazione cambia tono.",
					500,
				),
				effects: normalizeEffects(choice.effects || choice),
				senderId: senderId,
			});
		}
		return out;
	}
	function standardChoices(kind, senderId) {
		if (kind === "management") {
			return normalizeChoices(
				[
					{
						id: "commit",
						label: "Accetta il target e chiedi responsabilita",
						tone: "cooperativo",
						reply:
							"La direzione registra la tua disponibilita e alza le aspettative.",
						effects: {
							employerTrust: 5,
							reputation: 2,
							xp: 25,
							relationship: 4,
						},
					},
					{
						id: "challenge",
						label: "Contesta il piano con dati e sangue freddo",
						tone: "assertivo",
						reply:
							"Hai guadagnato rispetto, ma il management non dimentica la sfida.",
						effects: {
							employerTrust: -1,
							reputation: 4,
							xp: 35,
							relationship: 1,
						},
					},
					{
						id: "evade",
						label: "Prometti senza esporti davvero",
						tone: "evasivo",
						reply: "La risposta evita lo scontro, ma aumenta i sospetti.",
						effects: { employerTrust: -5, ethics: -2, relationship: -3 },
					},
				],
				senderId,
			);
		}
		if (kind === "colleague") {
			return normalizeChoices(
				[
					{
						id: "ally",
						label: "Proponi un alleanza reciproca",
						tone: "collaborativo",
						reply:
							"Nasce un patto fragile, utile finche gli interessi coincidono.",
						effects: { reputation: 1, relationship: 7, xp: 20 },
					},
					{
						id: "probe",
						label: "Fai domande e non rivelare le tue carte",
						tone: "prudente",
						reply:
							"Raccogli informazioni, ma il collega percepisce la distanza.",
						effects: { ethics: 1, relationship: -1, xp: 15 },
					},
					{
						id: "threat",
						label: "Ricorda chi comanda sul desk",
						tone: "aggressivo",
						reply: "La tensione sale: ottieni spazio, ma crei un nemico.",
						effects: { reputation: 3, ethics: -3, relationship: -8 },
					},
				],
				senderId,
			);
		}
		return normalizeChoices(
			[
				{
					id: "listen",
					label: "Ascolta e approfondisci",
					tone: "empatico",
					reply: "La conversazione si apre e lascia una traccia positiva.",
					effects: { relationship: 4, xp: 15 },
				},
				{
					id: "direct",
					label: "Vai dritto al punto",
					tone: "assertivo",
					reply:
						"La risposta e netta: guadagni chiarezza, non necessariamente simpatia.",
					effects: { reputation: 2, relationship: 0, xp: 20 },
				},
				{
					id: "dismiss",
					label: "Chiudi la conversazione",
					tone: "freddo",
					reply: "Il silenzio diventa una memoria difficile da cancellare.",
					effects: { relationship: -5 },
				},
			],
			senderId,
		);
	}
	function addWeeklyFallbackMessages(state) {
		var im = ensureState(state);
		var key = weekKey(state);
		var management = careerSpeaker();
		var ctx = getCareerContext();
		var career = getCareerState();
		addMessage(state, {
			id: "weekly_management_" + key.replace(":", "_"),
			source: "fallback",
			type: "management",
			senderId: management.id,
			senderName: management.name,
			senderRole: management.role,
			locationId: "meeting-room",
			mood: ctx ? ctx.employerMood : "vigile",
			title:
				ctx && ctx.employerTrust < 35
					? "Convocazione urgente"
					: "Briefing settimanale del desk",
			text:
				ctx && ctx.employerTrust < 35
					? "I numeri non convincono. La direzione vuole una risposta prima che il rischio diventi personale."
					: "Il desk pretende risultati, disciplina e una posizione chiara sui rischi della settimana.",
			choices: standardChoices("management", management.id),
		});
		var colleagues = career && career.colleagues ? career.colleagues : [];
		if (colleagues.length) {
			var week = state.player ? state.player.week : 1;
			var colleague = colleagues[(week - 1) % colleagues.length];
			var colleagueId = "colleague:" + slug(colleague.id || colleague.name);
			addMessage(state, {
				id: "weekly_colleague_" + key.replace(":", "_"),
				source: "fallback",
				type: "colleague",
				senderId: colleagueId,
				senderName: colleague.name,
				senderRole: "Collega di desk",
				locationId: week % 2 === 0 ? "corridor" : "desk",
				mood: colleague.relationship > 55 ? "collaborativo" : "guardingo",
				title:
					colleague.relationship < 35
						? "Una voce ostile dal desk"
						: "Una proposta tra colleghi",
				text:
					colleague.lastMove ||
					"Ti propone di scambiare informazioni prima della prossima riunione.",
				choices: standardChoices("colleague", colleagueId),
			});
		}
		var agents = state.agents || [];
		for (var i = 0; i < agents.length; i++) {
			if (agents[i].wantsMeeting) {
				var agentId = "agent:" + slug(agents[i].name);
				addMessage(state, {
					id:
						"agent_" +
						slug(agents[i].id || agents[i].name) +
						"_" +
						key.replace(":", "_"),
					source: "fallback",
					type: "agent",
					senderId: agentId,
					senderName: agents[i].name,
					senderRole: "Agente " + (agents[i].skill || "trading"),
					locationId: "desk",
					mood: agents[i].currentMood || "vigile",
					title: "Vuole parlarti",
					text:
						agents[i].lastBriefing ||
						agents[i].marketView ||
						"Ha una lettura del mercato che non vuole affidare a un report.",
					choices: standardChoices("generic", agentId),
				});
			}
		}
		if (
			state.market &&
			state.market.assembliesThisWeek &&
			state.market.assembliesThisWeek.length
		) {
			var assembly = state.market.assembliesThisWeek[0];
			addMessage(state, {
				id: "assembly_" + key.replace(":", "_"),
				source: "fallback",
				type: "assembly",
				senderId: "assembly:" + slug(assembly.ticker || assembly.companyId),
				senderName: assembly.companyName || assembly.ticker || "Assemblea",
				senderRole: "Segreteria societaria",
				locationId: "assembly-foyer",
				mood: "politico",
				title: "Pressioni prima del voto",
				text: "Nel foyer si formano blocchi e alleanze. Il tuo voto ha attirato attenzione.",
				choices: standardChoices(
					"generic",
					"assembly:" + slug(assembly.ticker || assembly.companyId),
				),
			});
		}
		im.lastProcessedWeek = key;
	}
	function findMessage(state, id) {
		var messages = ensureState(state).messages;
		for (var i = 0; i < messages.length; i++)
			if (messages[i].id === id) return messages[i];
		return null;
	}
	function getMessages(opts) {
		var state = currentState();
		if (!state) return [];
		var list = ensureState(state).messages.slice();
		opts = opts || {};
		var out = [];
		for (var i = 0; i < list.length; i++) {
			if (opts.unreadOnly && list[i].read) continue;
			if (opts.type && list[i].type !== opts.type) continue;
			out.push(copy(list[i]));
			if (opts.limit && out.length >= opts.limit) break;
		}
		return out;
	}
	function markMessageRead(id) {
		var state = currentState();
		if (!state) return false;
		var im = ensureState(state);
		var message = findMessage(state, id);
		if (!message) return false;
		if (!message.read) im.stats.messagesRead++;
		message.read = true;
		saveAndRefresh();
		return true;
	}
	function unreadCount() {
		var state = currentState();
		if (!state) return 0;
		var messages = ensureState(state).messages;
		var count = 0;
		for (var i = 0; i < messages.length; i++) if (!messages[i].read) count++;
		return count;
	}
	function addConversationEntry(state, characterId, entry) {
		var im = ensureState(state);
		if (!im.conversations[characterId]) im.conversations[characterId] = [];
		im.conversations[characterId].push(entry);
		if (im.conversations[characterId].length > MAX_CONVERSATION_ENTRIES) {
			im.conversations[characterId] = im.conversations[characterId].slice(
				-MAX_CONVERSATION_ENTRIES,
			);
		}
	}
	function applyEffects(state, senderId, effects, reason) {
		effects = normalizeEffects(effects);
		var player = state.player;
		if (player) {
			player.ethics = clamp(
				(player.ethics == null ? 50 : player.ethics) + effects.ethics,
				0,
				100,
			);
			if (player.reputation && typeof player.reputation.wallStreet === "number")
				player.reputation.wallStreet = clamp(
					player.reputation.wallStreet + effects.reputation,
					0,
					100,
				);
			player.cash = (player.cash || 0) + effects.cash;
			player.xp = Math.max(0, (player.xp || 0) + effects.xp);
		}
		var career = getCareerState();
		if (career) {
			career.employerTrust = clamp(
				(career.employerTrust || 0) + effects.employerTrust,
				0,
				100,
			);
			var colleagues = career.colleagues || [];
			for (var i = 0; i < colleagues.length; i++) {
				if (
					"colleague:" + slug(colleagues[i].id || colleagues[i].name) ===
					senderId
				) {
					colleagues[i].relationship = clamp(
						(colleagues[i].relationship || 50) + effects.relationship,
						0,
						100,
					);
					colleagues[i].lastMove = safe(reason, 180);
				}
			}
		}
		var narrativeEngine = getNarrativeEngine();
		if (
			narrativeEngine &&
			narrativeEngine.setRelationship &&
			effects.relationship !== 0
		) {
			narrativeEngine.setRelationship(
				state,
				senderId,
				"player:broker",
				effects.relationship,
				reason,
			);
		}
		if (narrativeEngine && narrativeEngine.addMemory) {
			narrativeEngine.addMemory(state, {
				type: "immersive-choice",
				text: reason,
				actors: [senderId, "player:broker"],
				impact: effects.relationship >= 0 ? "positive" : "negative",
				importance: 7,
			});
		}
	}
	function resolveMessage(id, choiceId) {
		var state = currentState();
		if (!state) return { success: false, error: "Stato non disponibile" };
		var message = findMessage(state, id);
		if (!message) return { success: false, error: "Messaggio non trovato" };
		if (message.resolved) return { success: false, error: "Hai gia risposto" };
		var choice = null;
		for (var i = 0; i < message.choices.length; i++)
			if (message.choices[i].id === choiceId) choice = message.choices[i];
		if (!choice) return { success: false, error: "Scelta non valida" };
		message.read = true;
		message.resolved = true;
		message.chosenChoiceId = choice.id;
		message.outcomeText = choice.reply;
		applyEffects(
			state,
			message.senderId,
			choice.effects,
			message.senderName + ": " + choice.reply,
		);
		ensureState(state).stats.choicesMade++;
		addConversationEntry(state, message.senderId, {
			id: uid("conv"),
			week: state.player.week,
			locationId: message.locationId,
			speaker: "player",
			text: choice.label,
			outcome: choice.reply,
		});
		saveAndRefresh();
		return { success: true, message: copy(message), choice: copy(choice) };
	}
	function fallbackInteraction(state, character, locationId) {
		var namespace = character.namespace || "npc";
		var kind =
			namespace === "management" || namespace === "firm"
				? "management"
				: namespace === "colleague"
					? "colleague"
					: "generic";
		var line =
			character.currentGoal ||
			character.backstory ||
			"Il mercato non lascia spazio alle conversazioni inutili.";
		return {
			id: uid("interaction"),
			characterId: character.id,
			characterName: character.name,
			characterRole: character.role,
			locationId: locationId || "desk",
			week: state.player.week,
			source: "fallback",
			mood: character.currentMood || "neutrale",
			line: safe(line, 700),
			choices: standardChoices(kind, character.id),
			resolved: false,
			chosenChoiceId: "",
			outcomeText: "",
		};
	}
	function parseJsonObject(text) {
		if (!text || typeof text !== "string") return null;
		var start = text.indexOf("{");
		var end = text.lastIndexOf("}");
		if (start < 0 || end <= start) return null;
		try {
			return JSON.parse(text.substring(start, end + 1));
		} catch (e) {
			return null;
		}
	}
	function llmSettings() {
		var narrativeEngine = getNarrativeEngine();
		if (!narrativeEngine || !narrativeEngine.getSettings) return null;
		try {
			return narrativeEngine.getSettings();
		} catch (e) {
			return null;
		}
	}
	function llmEnabled() {
		var settings = llmSettings();
		return !!(
			settings &&
			settings.enabled &&
			settings.endpoint &&
			settings.apiKey &&
			global.fetch
		);
	}
	function callLLM(systemPrompt, userPrompt) {
		var settings = llmSettings();
		if (!llmEnabled()) return Promise.resolve(null);
		var body = {
			model: settings.model || "glm-5.2",
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			format: "json",
			stream: false,
			options: {
				temperature: settings.temperature == null ? 0.85 : settings.temperature,
				num_predict: Math.min(settings.maxTokens || 1800, 2200),
			},
		};
		return global
			.fetch(settings.endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + settings.apiKey,
				},
				body: JSON.stringify(body),
			})
			.then(function (response) {
				if (!response.ok) return null;
				return response.json();
			})
			.then(function (data) {
				if (!data) return null;
				var content =
					data.message ||
					(data.choices && data.choices[0] && data.choices[0].message) ||
					data;
				var text =
					typeof content === "string"
						? content
						: content.content || content.text || "";
				return parseJsonObject(text);
			})
			.catch(function () {
				return null;
			});
	}
	function beginInteraction(characterId, locationId) {
		var state = currentState();
		if (!state) return Promise.resolve(null);
		var characters = ensureCharacters(state);
		var character = characters[characterId];
		if (!character) return Promise.resolve(null);
		var interaction = fallbackInteraction(state, character, locationId);
		ensureState(state).interactions[interaction.id] = interaction;
		ensureState(state).stats.conversationsStarted++;
		if (!llmEnabled()) {
			addConversationEntry(state, character.id, {
				id: uid("conv"),
				week: state.player.week,
				locationId: locationId,
				speaker: character.id,
				text: interaction.line,
				source: "fallback",
			});
			saveAndRefresh();
			return Promise.resolve(copy(interaction));
		}
		ensureState(state).llmStatus = "thinking";
		notifyUI();
		var memories = ensureNarrative(state).memories || [];
		var recent = [];
		for (var i = 0; i < memories.length && recent.length < 4; i++) {
			if (!memories[i].actors || memories[i].actors.indexOf(character.id) >= 0)
				recent.push(memories[i].text);
		}
		var location = findLocation(state, locationId) || {
			title: locationId,
			atmosphere: "vigile",
		};
		var prompt =
			"Personaggio: " +
			character.name +
			" (" +
			character.role +
			"). Tratti: " +
			(character.traits || []).join(", ") +
			". Mood: " +
			character.currentMood +
			".\n" +
			"Luogo: " +
			location.title +
			", atmosfera " +
			location.atmosphere +
			".\n" +
			"Giocatore: patrimonio " +
			Math.round(state.player.netWorth || state.player.cash || 0) +
			", etica " +
			state.player.ethics +
			", reputazione " +
			(state.player.reputation ? state.player.reputation.wallStreet : 50) +
			".\n" +
			"Memorie: " +
			(recent.length ? recent.join(" | ") : "nessuna") +
			".\n" +
			"Genera una battuta immersiva in prima persona e 3 risposte del giocatore: cooperativa, assertiva, rischiosa. Effetti ammessi e limitati: ethics, reputation, employerTrust, relationship, xp.\n" +
			'Rispondi SOLO JSON: {"line":"...","mood":"...","choices":[{"id":"...","label":"...","tone":"...","reply":"conseguenza narrativa","effects":{"ethics":0,"reputation":0,"employerTrust":0,"relationship":0,"xp":0}}]}';
		return callLLM(
			"Sei il game master di un broker story game italiano. Il dialogo deve ricordare il passato e creare tensione concreta.",
			prompt,
		).then(function (raw) {
			if (raw && raw.line) {
				interaction.source = "llm";
				interaction.line = safe(raw.line, 800);
				interaction.mood = safe(raw.mood || interaction.mood, 40);
				interaction.choices = normalizeChoices(
					raw.choices || interaction.choices,
					character.id,
				);
				ensureState(state).llmStatus = "active";
				ensureState(state).llmLastError = "";
			} else {
				ensureState(state).llmStatus = "fallback";
				ensureState(state).llmLastError = "Risposta LLM non valida";
			}
			addConversationEntry(state, character.id, {
				id: uid("conv"),
				week: state.player.week,
				locationId: locationId,
				speaker: character.id,
				text: interaction.line,
				source: interaction.source,
			});
			saveAndRefresh();
			return copy(interaction);
		});
	}
	function resolveInteraction(interactionId, choiceId) {
		var state = currentState();
		if (!state) return { success: false, error: "Stato non disponibile" };
		var interaction = ensureState(state).interactions[interactionId];
		if (!interaction)
			return { success: false, error: "Interazione non trovata" };
		if (interaction.resolved)
			return { success: false, error: "Interazione gia risolta" };
		var choice = null;
		for (var i = 0; i < interaction.choices.length; i++)
			if (interaction.choices[i].id === choiceId)
				choice = interaction.choices[i];
		if (!choice) return { success: false, error: "Scelta non valida" };
		interaction.resolved = true;
		interaction.chosenChoiceId = choice.id;
		interaction.outcomeText = choice.reply;
		applyEffects(
			state,
			interaction.characterId,
			choice.effects,
			interaction.characterName + ": " + choice.reply,
		);
		ensureState(state).stats.choicesMade++;
		addConversationEntry(state, interaction.characterId, {
			id: uid("conv"),
			week: state.player.week,
			locationId: interaction.locationId,
			speaker: "player",
			text: choice.label,
			outcome: choice.reply,
		});
		saveAndRefresh();
		return {
			success: true,
			interaction: copy(interaction),
			choice: copy(choice),
		};
	}
	function getLocations() {
		var state = currentState();
		return state ? copy(buildLocations(state)) : [];
	}
	function getCharacters() {
		var state = currentState();
		return state ? copy(ensureCharacters(state)) : {};
	}
	function getConversation(characterId) {
		var state = currentState();
		if (!state) return [];
		return copy(ensureState(state).conversations[characterId] || []);
	}
	function addCanonicalNews(state, news) {
		if (!news || !news.length) return;
		if (!state.notifications) state.notifications = [];
		for (var i = 0; i < news.length; i++) {
			var duplicate = false;
			for (var j = 0; j < state.notifications.length; j++) {
				if (
					state.notifications[j].title === news[i].title &&
					state.notifications[j].week === state.player.week
				)
					duplicate = true;
			}
			if (!duplicate) {
				state.notifications.unshift({
					id: uid("news"),
					week: state.player.week,
					type: news[i].impact || "neutral",
					title: safe(news[i].title, 140),
					message: safe(news[i].content, 600),
					read: false,
					timestamp: Date.now(),
				});
			}
		}
		if (state.notifications.length > 60)
			state.notifications = state.notifications.slice(0, 60);
	}
	function weeklyLLMPack(state) {
		if (!llmEnabled()) return Promise.resolve(null);
		var characters = ensureCharacters(state);
		var roster = [];
		var keys = Object.keys(characters);
		for (var i = 0; i < keys.length && roster.length < 12; i++) {
			if (characters[keys[i]].namespace !== "player")
				roster.push({
					id: keys[i],
					name: characters[keys[i]].name,
					role: characters[keys[i]].role,
					mood: characters[keys[i]].currentMood,
				});
		}
		var ctx = getCareerContext();
		var prompt =
			"Settimana " +
			state.player.week +
			", anno " +
			state.player.year +
			". Patrimonio " +
			Math.round(state.player.netWorth || state.player.cash || 0) +
			", etica " +
			state.player.ethics +
			".\n" +
			"Carriera: " +
			JSON.stringify(ctx || {}) +
			".\nPersonaggi ammessi: " +
			JSON.stringify(roster) +
			".\n" +
			"Genera 2 messaggi inbox immersivi da personaggi ammessi. Ogni messaggio deve richiamare risultati, rischio, politica interna o assemblee. Includi 3 risposte con effetti limitati.\n" +
			'Rispondi SOLO JSON: {"messages":[{"senderId":"id ammesso","title":"...","text":"...","mood":"...","locationId":"desk|corridor|meeting-room|ceo-office|assembly-foyer","choices":[{"id":"...","label":"...","tone":"...","reply":"...","effects":{"ethics":0,"reputation":0,"employerTrust":0,"relationship":0,"xp":0}}]}]}';
		return callLLM(
			"Sei il direttore narrativo di un broker tycoon. Scrivi messaggi vivi, ricordabili e con conflitti reali.",
			prompt,
		).then(function (raw) {
			if (!raw || !(raw.messages instanceof Array)) return null;
			var added = [];
			for (var m = 0; m < raw.messages.length && m < 2; m++) {
				var item = raw.messages[m] || {};
				var character = characters[item.senderId];
				if (!character) continue;
				added.push(
					addMessage(state, {
						source: "llm",
						type: character.namespace || "npc",
						senderId: character.id,
						senderName: character.name,
						senderRole: character.role,
						locationId: item.locationId || "desk",
						mood: item.mood || character.currentMood,
						title: item.title,
						text: item.text,
						choices: item.choices || standardChoices("generic", character.id),
					}),
				);
			}
			if (added.length) ensureState(state).llmStatus = "active";
			return added;
		});
	}
	function processWeek(state) {
		if (!state || !state.player) return Promise.resolve(null);
		var im = ensureState(state);
		var key = weekKey(state);
		if (im.lastProcessedWeek === key || processingWeeks[key])
			return Promise.resolve(null);
		processingWeeks[key] = true;
		ensureCharacters(state);
		buildLocations(state);
		addWeeklyFallbackMessages(state);
		notifyUI();
		var orchestration = null;
		if (global.LLMNewsEngine && global.LLMNewsEngine.processNewsTurn)
			orchestration = global.LLMNewsEngine.processNewsTurn(state);
		else if (global.LLMNarrativeEngine && global.LLMNarrativeEngine.processTurn)
			orchestration = global.LLMNarrativeEngine.processTurn(state);
		else orchestration = Promise.resolve(null);
		return Promise.resolve(orchestration)
			.then(function (news) {
				if (news instanceof Array) addCanonicalNews(state, news);
				return weeklyLLMPack(state);
			})
			.then(function () {
				delete processingWeeks[key];
				saveAndRefresh();
				return copy(im);
			})
			.catch(function (err) {
				delete processingWeeks[key];
				im.llmStatus = "fallback";
				im.llmLastError = safe(
					err && err.message ? err.message : "Errore LLM",
					180,
				);
				saveAndRefresh();
				return copy(im);
			});
	}
	function notifyUI() {
		try {
			if (global.wolfBridge && global.wolfBridge.sync) global.wolfBridge.sync();
			if (typeof global.renderNarrative === "function")
				global.renderNarrative();
			if (global.document && global.CustomEvent && global.dispatchEvent)
				global.dispatchEvent(new global.CustomEvent("wolf-immersive-update"));
		} catch (e) {}
	}
	function saveAndRefresh() {
		notifyUI();
		try {
			if (typeof global.saveAuto === "function") global.saveAuto();
		} catch (e) {}
	}
	function install(gameEngine) {
		if (gameEngine) engine = gameEngine;
		if (!engine || !engine.getState) return false;
		var state = engine.getState();
		if (!state) return false;
		ensureState(state);
		ensureCharacters(state);
		buildLocations(state);
		if (!installed) {
			installed = true;
			if (engine.on) {
				engine.on("weekAdvanced", function () {
					processWeek(engine.getState());
				});
				engine.on("stateCreated", function () {
					var created = engine.getState();
					if (created) {
						delete processingWeeks[weekKey(created)];
						ensureState(created);
						ensureCharacters(created);
						buildLocations(created);
					}
				});
				engine.on("stateLoaded", function () {
					var loaded = engine.getState();
					if (loaded) {
						ensureState(loaded);
						ensureCharacters(loaded);
						buildLocations(loaded);
						if (!ensureState(loaded).messages.length) processWeek(loaded);
						else notifyUI();
					}
				});
			}
			if (
				typeof global.newGame === "function" &&
				!global.newGame.__immersiveWrapped
			) {
				var previousNewGame = global.newGame;
				var immersiveNewGame = function () {
					var result = previousNewGame.apply(global, arguments);
					var createdState = engine.getState();
					if (createdState) {
						delete processingWeeks[weekKey(createdState)];
						ensureState(createdState);
						ensureCharacters(createdState);
						buildLocations(createdState);
						processWeek(createdState);
					}
					return result;
				};
				immersiveNewGame.__immersiveWrapped = true;
				global.newGame = immersiveNewGame;
			}
		}
		if (!ensureState(state).messages.length) processWeek(state);
		return true;
	}

	global.ImmersiveEngine = {
		version: VERSION,
		install: install,
		ensureState: ensureState,
		processWeek: processWeek,
		getMessages: getMessages,
		unreadCount: unreadCount,
		markMessageRead: markMessageRead,
		resolveMessage: resolveMessage,
		getLocations: getLocations,
		getCharacters: getCharacters,
		getConversation: getConversation,
		beginInteraction: beginInteraction,
		resolveInteraction: resolveInteraction,
		llmEnabled: llmEnabled,
		getState: function () {
			var state = currentState();
			return state ? copy(ensureState(state)) : null;
		},
	};

	if (typeof module !== "undefined" && module.exports)
		module.exports = global.ImmersiveEngine;
})(
	typeof window !== "undefined"
		? window
		: typeof global !== "undefined"
			? global
			: this,
);
