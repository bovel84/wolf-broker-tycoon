/*
 * immersive-ui.js
 * UI dinamica per Immersive Core. Viene traspilata da Babel nel file finale.
 */
((global) => {
	var runtime = null;
	var installed = false;
	var currentTab = "inbox";
	var currentMessageId = "";
	var currentLocationId = "";
	var currentInteraction = null;
	var observer = null;

	var ICONS = {
		management: "🏦",
		colleague: "👥",
		agent: "🕵️",
		competitor: "🦈",
		assembly: "🏛️",
		staff: "🧑‍💼",
		firm: "🏢",
		npc: "🎭",
		system: "📌",
	};

	function esc(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
	function icon(type) {
		return ICONS[type] || "🎭";
	}
	function byId(id) {
		return global.document ? global.document.getElementById(id) : null;
	}
	function replaceEscapedMarkup(element, markup) {
		while (element.firstChild) element.removeChild(element.firstChild);
		var range = global.document.createRange();
		range.selectNodeContents(element);
		element.appendChild(range.createContextualFragment(markup));
	}
	function toastMessage(kind, message) {
		try {
			if (typeof global.toast === "function") global.toast(kind, message);
			else if (global.UIEngine && global.UIEngine.toast)
				global.UIEngine.toast(kind, "Immersive Core", message);
		} catch (e) {}
	}
	function injectStyles() {
		if (!global.document || byId("immersive-style")) return;
		var style = global.document.createElement("style");
		style.id = "immersive-style";
		style.textContent = [
			"#immersive-fab{position:fixed;right:18px;bottom:74px;z-index:9000;width:56px;height:56px;border-radius:50%;border:2px solid #d4af37;background:linear-gradient(145deg,#182845,#080d16);color:#f4d889;font-size:24px;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;transition:transform .2s}",
			"#immersive-fab:hover{transform:translateY(-3px) scale(1.04)}",
			".immersive-badge{position:absolute;right:-4px;top:-5px;min-width:21px;height:21px;padding:0 5px;border-radius:12px;background:#ef4444;color:white;font:bold 11px Arial;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #080d16}",
			".immersive-nav-badge{display:inline-block;min-width:17px;padding:1px 5px;margin-left:4px;border-radius:9px;background:#ef4444;color:white;font-size:10px}",
			"#immersive-overlay{position:fixed;inset:0;z-index:20000;background:rgba(1,4,9,.82);display:none;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(6px)}",
			"#immersive-overlay.show{display:flex}",
			".immersive-shell{width:min(1050px,100%);height:min(760px,94vh);background:linear-gradient(145deg,#111a2b,#080d16);border:1px solid rgba(212,175,55,.7);border-radius:15px;box-shadow:0 28px 90px rgba(0,0,0,.82);display:grid;grid-template-rows:auto auto 1fr;overflow:hidden}",
			".immersive-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid rgba(212,175,55,.25);background:linear-gradient(90deg,rgba(212,175,55,.12),transparent)}",
			".immersive-title{font:800 18px Georgia,serif;color:#f4d889;letter-spacing:.8px}.immersive-sub{font-size:10px;color:#8a96b0;margin-top:2px}",
			".immersive-close{background:none;border:0;color:#8a96b0;font-size:22px;cursor:pointer;padding:6px}.immersive-close:hover{color:#f4d889}",
			".immersive-tabs{display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.07);overflow-x:auto}.immersive-tab{border:0;background:transparent;color:#8a96b0;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:700;white-space:nowrap}.immersive-tab.active{background:rgba(59,130,246,.18);color:#dce9ff}",
			".immersive-body{overflow:auto;padding:14px}.immersive-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:10px}",
			".immersive-card{background:rgba(18,29,48,.88);border:1px solid rgba(138,150,176,.18);border-radius:11px;padding:12px;color:#d8deea}.immersive-card.unread{border-left:4px solid #d4af37;background:linear-gradient(90deg,rgba(212,175,55,.08),rgba(18,29,48,.88))}",
			".immersive-card.clickable{cursor:pointer;transition:transform .15s,border-color .15s}.immersive-card.clickable:hover{transform:translateY(-2px);border-color:rgba(212,175,55,.55)}",
			".immersive-row{display:flex;gap:10px;align-items:flex-start}.immersive-avatar{font-size:28px;line-height:1}.immersive-grow{flex:1;min-width:0}.immersive-name{font-weight:800;color:#eef3ff}.immersive-meta{font-size:10px;color:#8a96b0;margin-top:2px}.immersive-copy{font-size:12px;line-height:1.55;color:#c5ccda;margin-top:8px}.immersive-tag{display:inline-block;padding:2px 7px;border-radius:10px;background:rgba(59,130,246,.16);color:#93b8ff;font-size:9px;margin-right:4px}",
			".immersive-detail{max-width:760px;margin:0 auto}.immersive-detail h2{font:800 23px Georgia,serif;color:#f4d889;margin:8px 0}.immersive-quote{font:italic 16px/1.65 Georgia,serif;color:#eef3ff;border-left:3px solid #d4af37;padding:14px 17px;background:rgba(212,175,55,.06);border-radius:0 9px 9px 0;margin:15px 0}",
			".immersive-actions{display:grid;gap:9px;margin-top:14px}.immersive-choice{width:100%;text-align:left;border:1px solid rgba(138,150,176,.28);background:#111d31;color:#eef3ff;border-radius:9px;padding:12px 14px;cursor:pointer;font:700 12px Georgia,serif}.immersive-choice:hover{border-color:#d4af37;background:rgba(212,175,55,.1)}",
			".immersive-outcome{padding:12px 14px;border:1px solid rgba(0,214,143,.35);background:rgba(0,214,143,.08);border-radius:9px;color:#89f2cf;line-height:1.5}",
			".immersive-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap}.immersive-status{font-size:10px;color:#8a96b0}.immersive-empty{text-align:center;padding:55px 20px;color:#8a96b0}.immersive-empty .emoji{font-size:44px;margin-bottom:8px}",
			".immersive-location-hero{padding:16px;border-radius:12px;background:linear-gradient(130deg,rgba(59,130,246,.14),rgba(168,85,247,.08));border:1px solid rgba(59,130,246,.25);margin-bottom:12px}",
			".immersive-person{display:flex;align-items:center;gap:10px;padding:10px;border-radius:9px;background:rgba(255,255,255,.035);margin-top:7px}.immersive-person button{margin-left:auto}",
			".immersive-btn{border:1px solid rgba(212,175,55,.45);background:rgba(212,175,55,.09);color:#f4d889;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:10px;font-weight:700}.immersive-btn:hover{background:rgba(212,175,55,.18)}",
			".immersive-clickable{cursor:pointer!important;outline:1px solid rgba(212,175,55,.22);transition:transform .15s,outline-color .15s}.immersive-clickable:hover,.immersive-clickable:focus{transform:translateY(-2px);outline-color:#d4af37}.immersive-click-hint{display:block;color:#f4d889;font-size:9px;margin-top:7px}",
			".immersive-loading{padding:45px;text-align:center;color:#f4d889}.immersive-spinner{width:34px;height:34px;border-radius:50%;border:3px solid rgba(212,175,55,.2);border-top-color:#d4af37;animation:immersive-spin .8s linear infinite;margin:0 auto 12px}@keyframes immersive-spin{to{transform:rotate(360deg)}}",
			"@media(max-width:640px){#immersive-fab{right:12px;bottom:68px;width:49px;height:49px}.immersive-shell{height:100%;max-height:100vh;border-radius:0}.immersive-body{padding:10px}.immersive-grid{grid-template-columns:1fr}}",
		].join("");
		global.document.head.appendChild(style);
	}
	function injectShell() {
		if (!global.document) return;
		if (!byId("immersive-fab")) {
			var fab = global.document.createElement("button");
			fab.id = "immersive-fab";
			fab.type = "button";
			fab.setAttribute("aria-label", "Apri mondo immersivo");
			fab.appendChild(global.document.createTextNode("💬"));
			var fabBadge = global.document.createElement("span");
			fabBadge.id = "immersive-fab-badge";
			fabBadge.className = "immersive-badge";
			fabBadge.style.display = "none";
			fabBadge.textContent = "0";
			fab.appendChild(fabBadge);
			fab.addEventListener("click", () => {
				open("inbox");
			});
			global.document.body.appendChild(fab);
		}
		if (!byId("immersive-overlay")) {
			var overlay = global.document.createElement("div");
			overlay.id = "immersive-overlay";
			replaceEscapedMarkup(
				overlay,
				'<section class="immersive-shell" role="dialog" aria-modal="true" aria-label="Immersive Core"><header class="immersive-head"><div><div class="immersive-title">🐺 Immersive Core</div><div class="immersive-sub" id="immersive-head-status">Mondo vivo · memoria persistente · LLM</div></div><button type="button" class="immersive-close" data-imm-action="close" aria-label="Chiudi">✕</button></header><nav class="immersive-tabs"><button class="immersive-tab" data-imm-action="tab" data-tab="inbox">📨 Inbox</button><button class="immersive-tab" data-imm-action="tab" data-tab="locations">🏙️ Luoghi</button><button class="immersive-tab" data-imm-action="tab" data-tab="conversations">💬 Conversazioni</button></nav><main class="immersive-body" id="immersive-body"></main></section>',
			);
			overlay.addEventListener("click", handleClick);
			overlay.addEventListener("click", (event) => {
				if (event.target === overlay) close();
			});
			global.document.body.appendChild(overlay);
		}
		var nav = global.document.querySelector(".nav");
		if (nav && !byId("immersive-nav-button")) {
			var button = global.document.createElement("button");
			button.id = "immersive-nav-button";
			button.type = "button";
			button.appendChild(global.document.createTextNode("Messaggi "));
			var navBadge = global.document.createElement("span");
			navBadge.id = "immersive-nav-badge";
			navBadge.className = "immersive-nav-badge";
			navBadge.style.display = "none";
			navBadge.textContent = "0";
			button.appendChild(navBadge);
			button.addEventListener("click", () => {
				open("inbox");
			});
			var diary = nav.querySelector('[data-view="narrative"]');
			if (diary && diary.nextSibling)
				nav.insertBefore(button, diary.nextSibling);
			else nav.appendChild(button);
		}
		var more = byId("mobileMoreMenu");
		if (more && !byId("immersive-mobile-button")) {
			var mobileButton = global.document.createElement("button");
			mobileButton.id = "immersive-mobile-button";
			mobileButton.className = "btn";
			mobileButton.style.cssText =
				"display:block;width:100%;text-align:left;margin-bottom:6px;min-height:44px";
			mobileButton.textContent = "💬 Messaggi e luoghi";
			mobileButton.addEventListener("click", () => {
				open("inbox");
				if (typeof global.toggleMobileMoreMenu === "function")
					global.toggleMobileMoreMenu();
			});
			more.insertBefore(mobileButton, more.firstChild);
		}
	}
	function updateBadge() {
		if (!runtime) return;
		var count = runtime.unreadCount();
		var ids = ["immersive-fab-badge", "immersive-nav-badge"];
		for (var i = 0; i < ids.length; i++) {
			var el = byId(ids[i]);
			if (!el) continue;
			el.textContent = count > 99 ? "99+" : String(count);
			el.style.display = count
				? ids[i] === "immersive-fab-badge"
					? "flex"
					: "inline-block"
				: "none";
		}
		var status = byId("immersive-head-status");
		var state = runtime.getState ? runtime.getState() : null;
		if (status && state)
			status.textContent =
				"Mondo vivo · " +
				count +
				" non letti · LLM " +
				(state.llmStatus === "active"
					? "attivo"
					: runtime.llmEnabled()
						? state.llmStatus
						: "fallback");
	}
	function open(tab) {
		currentTab = tab || currentTab || "inbox";
		currentMessageId = "";
		currentInteraction = null;
		injectStyles();
		injectShell();
		var overlay = byId("immersive-overlay");
		if (overlay) overlay.classList.add("show");
		render();
	}
	function close() {
		var overlay = byId("immersive-overlay");
		if (overlay) overlay.classList.remove("show");
		currentMessageId = "";
		currentInteraction = null;
	}
	function renderTabs() {
		var tabs = global.document.querySelectorAll(".immersive-tab");
		for (var i = 0; i < tabs.length; i++)
			tabs[i].classList.toggle(
				"active",
				tabs[i].getAttribute("data-tab") === currentTab,
			);
	}
	function renderInbox() {
		var messages = runtime.getMessages({});
		if (currentMessageId) {
			var selected = null;
			for (var s = 0; s < messages.length; s++)
				if (messages[s].id === currentMessageId) selected = messages[s];
			if (selected) return renderMessageDetail(selected);
			currentMessageId = "";
		}
		var html =
			'<div class="immersive-toolbar"><div><strong>Inbox narrativa</strong><div class="immersive-status">Management, colleghi, agenti e assemblee scrivono con memoria.</div></div><span class="immersive-tag">' +
			runtime.unreadCount() +
			" non letti</span></div>";
		if (!messages.length)
			return (
				html +
				'<div class="immersive-empty"><div class="emoji">📭</div>Avanza una settimana: il mondo iniziera a cercarti.</div>'
			);
		html += '<div class="immersive-grid">';
		for (var i = 0; i < messages.length; i++) {
			var m = messages[i];
			html +=
				'<article class="immersive-card clickable ' +
				(m.read ? "" : "unread") +
				'" data-imm-action="message" data-id="' +
				esc(m.id) +
				'"><div class="immersive-row"><div class="immersive-avatar">' +
				icon(m.type) +
				'</div><div class="immersive-grow"><div class="immersive-name">' +
				esc(m.title) +
				'</div><div class="immersive-meta">' +
				esc(m.senderName) +
				" · " +
				esc(m.senderRole) +
				" · S" +
				esc(m.week) +
				'</div><div class="immersive-copy">' +
				esc(m.text) +
				'</div><div style="margin-top:8px"><span class="immersive-tag">' +
				esc(m.locationId) +
				'</span><span class="immersive-tag">' +
				(m.resolved ? "risposto" : m.read ? "letto" : "nuovo") +
				"</span></div></div></div></article>";
		}
		return html + "</div>";
	}
	function renderMessageDetail(message) {
		var html =
			'<div class="immersive-detail"><button class="immersive-btn" data-imm-action="back-inbox">← Inbox</button><div class="immersive-meta" style="margin-top:14px">' +
			esc(message.senderRole) +
			" · " +
			esc(message.locationId) +
			" · Settimana " +
			esc(message.week) +
			"</div><h2>" +
			icon(message.type) +
			" " +
			esc(message.title) +
			'</h2><div class="immersive-name">' +
			esc(message.senderName) +
			'</div><div class="immersive-quote">' +
			esc(message.text) +
			"</div>";
		if (message.resolved)
			html +=
				'<div class="immersive-outcome">Hai risposto. ' +
				esc(message.outcomeText) +
				"</div>";
		else {
			html += '<div class="immersive-actions">';
			for (var i = 0; i < message.choices.length; i++) {
				var c = message.choices[i];
				html +=
					'<button class="immersive-choice" data-imm-action="message-choice" data-id="' +
					esc(message.id) +
					'" data-choice="' +
					esc(c.id) +
					'"><span class="immersive-tag">' +
					esc(c.tone) +
					"</span> " +
					esc(c.label) +
					"</button>";
			}
			html += "</div>";
		}
		html +=
			'<div style="margin-top:14px"><button class="immersive-btn" data-imm-action="talk" data-character="' +
			esc(message.senderId) +
			'" data-location="' +
			esc(message.locationId) +
			'">Parla direttamente</button></div></div>';
		return html;
	}
	function renderLocations() {
		var locations = runtime.getLocations();
		if (currentLocationId) {
			for (var i = 0; i < locations.length; i++)
				if (locations[i].id === currentLocationId)
					return renderLocationDetail(locations[i]);
			currentLocationId = "";
		}
		var html =
			'<div class="immersive-toolbar"><div><strong>Luoghi vivi</strong><div class="immersive-status">Ogni stanza offre persone, memoria e conflitti diversi.</div></div></div><div class="immersive-grid">';
		for (var l = 0; l < locations.length; l++) {
			var location = locations[l];
			html +=
				'<article class="immersive-card ' +
				(location.accessible ? "clickable" : "") +
				'" ' +
				(location.accessible
					? 'data-imm-action="location" data-id="' + esc(location.id) + '"'
					: "") +
				'><div class="immersive-avatar">' +
				esc(location.icon) +
				'</div><div class="immersive-name" style="margin-top:8px">' +
				esc(location.title) +
				'</div><div class="immersive-meta">Atmosfera: ' +
				esc(location.atmosphere) +
				'</div><div class="immersive-copy">' +
				esc(location.description) +
				'</div><div style="margin-top:8px"><span class="immersive-tag">' +
				location.occupants.length +
				" persone</span>" +
				(location.accessible
					? ""
					: '<span class="immersive-tag">bloccato</span>') +
				"</div></article>";
		}
		return html + "</div>";
	}
	function renderLocationDetail(location) {
		var characters = runtime.getCharacters();
		var html =
			'<button class="immersive-btn" data-imm-action="back-locations">← Luoghi</button><section class="immersive-location-hero"><div class="immersive-avatar">' +
			esc(location.icon) +
			'</div><h2 style="color:#f4d889;margin:7px 0">' +
			esc(location.title) +
			'</h2><div class="immersive-meta">Atmosfera: ' +
			esc(location.atmosphere) +
			'</div><div class="immersive-copy">' +
			esc(location.description) +
			'</div></section><div class="immersive-name">Presenti</div>';
		if (!location.occupants.length)
			return (
				html +
				'<div class="immersive-empty"><div class="emoji">🌫️</div>Il luogo e vuoto, ma conserva tracce di conversazioni recenti.</div>'
			);
		for (var i = 0; i < location.occupants.length; i++) {
			var character = characters[location.occupants[i]];
			if (!character) continue;
			html +=
				'<div class="immersive-person"><span class="immersive-avatar">' +
				icon(character.namespace) +
				'</span><div><div class="immersive-name">' +
				esc(character.name) +
				'</div><div class="immersive-meta">' +
				esc(character.role) +
				" · " +
				esc(character.currentMood) +
				'</div></div><button class="immersive-btn" data-imm-action="talk" data-character="' +
				esc(character.id) +
				'" data-location="' +
				esc(location.id) +
				'">Parla</button></div>';
		}
		return html;
	}
	function renderConversations() {
		var characters = runtime.getCharacters();
		var keys = Object.keys(characters);
		var html =
			'<div class="immersive-toolbar"><div><strong>Conversazioni persistenti</strong><div class="immersive-status">Le risposte diventano memorie e modificano le relazioni.</div></div></div><div class="immersive-grid">';
		var count = 0;
		for (var i = 0; i < keys.length; i++) {
			var entries = runtime.getConversation(keys[i]);
			if (!entries.length) continue;
			count++;
			var last = entries[entries.length - 1];
			html +=
				'<article class="immersive-card clickable" data-imm-action="talk" data-character="' +
				esc(keys[i]) +
				'" data-location="' +
				esc(last.locationId || "desk") +
				'"><div class="immersive-row"><div class="immersive-avatar">' +
				icon(characters[keys[i]].namespace) +
				'</div><div class="immersive-grow"><div class="immersive-name">' +
				esc(characters[keys[i]].name) +
				'</div><div class="immersive-meta">' +
				entries.length +
				" scambi · ultimo in " +
				esc(last.locationId || "desk") +
				'</div><div class="immersive-copy">' +
				esc(last.outcome || last.text) +
				"</div></div></div></article>";
		}
		if (!count)
			return '<div class="immersive-empty"><div class="emoji">💬</div>Apri un messaggio o entra in un luogo per iniziare una conversazione.</div>';
		return html + "</div>";
	}
	function renderInteraction() {
		if (!currentInteraction)
			return '<div class="immersive-loading"><div class="immersive-spinner"></div>Il personaggio sta ricordando e preparando una risposta…</div>';
		var interaction = currentInteraction;
		var html =
			'<div class="immersive-detail"><button class="immersive-btn" data-imm-action="interaction-back">← Torna al luogo</button><div class="immersive-meta" style="margin-top:14px">' +
			esc(interaction.characterRole) +
			" · " +
			esc(interaction.locationId) +
			" · " +
			esc(interaction.source).toUpperCase() +
			"</div><h2>" +
			esc(interaction.characterName) +
			'</h2><div class="immersive-quote">“' +
			esc(interaction.line) +
			"”</div>";
		if (interaction.resolved)
			html +=
				'<div class="immersive-outcome">' +
				esc(interaction.outcomeText) +
				"</div>";
		else {
			html += '<div class="immersive-actions">';
			for (var i = 0; i < interaction.choices.length; i++) {
				var choice = interaction.choices[i];
				html +=
					'<button class="immersive-choice" data-imm-action="interaction-choice" data-id="' +
					esc(interaction.id) +
					'" data-choice="' +
					esc(choice.id) +
					'"><span class="immersive-tag">' +
					esc(choice.tone) +
					"</span> " +
					esc(choice.label) +
					"</button>";
			}
			html += "</div>";
		}
		return html + "</div>";
	}
	function render() {
		if (!runtime || !byId("immersive-body")) return;
		renderTabs();
		updateBadge();
		var body = byId("immersive-body");
		var markup =
			currentInteraction !== null
				? renderInteraction()
				: currentTab === "locations"
					? renderLocations()
					: currentTab === "conversations"
						? renderConversations()
						: renderInbox();
		replaceEscapedMarkup(body, markup);
	}
	function talk(characterId, locationId) {
		currentInteraction = null;
		currentLocationId = locationId || "desk";
		render();
		runtime
			.beginInteraction(characterId, currentLocationId)
			.then((interaction) => {
				if (!interaction) {
					toastMessage("error", "Personaggio non disponibile");
					currentInteraction = null;
					render();
					return;
				}
				currentInteraction = interaction;
				render();
			});
	}
	function handleClick(event) {
		var target = event.target;
		while (
			target &&
			target !== event.currentTarget &&
			!target.getAttribute("data-imm-action")
		)
			target = target.parentNode;
		if (!target || !target.getAttribute) return;
		var action = target.getAttribute("data-imm-action");
		if (!action) return;
		if (action === "close") close();
		else if (action === "tab") {
			currentTab = target.getAttribute("data-tab");
			currentMessageId = "";
			currentLocationId = "";
			currentInteraction = null;
			render();
		} else if (action === "message") {
			currentMessageId = target.getAttribute("data-id");
			runtime.markMessageRead(currentMessageId);
			render();
		} else if (action === "back-inbox") {
			currentMessageId = "";
			render();
		} else if (action === "message-choice") {
			var result = runtime.resolveMessage(
				target.getAttribute("data-id"),
				target.getAttribute("data-choice"),
			);
			if (result.success) toastMessage("success", result.choice.reply);
			else toastMessage("error", result.error);
			render();
		} else if (action === "location") {
			currentLocationId = target.getAttribute("data-id");
			currentInteraction = null;
			render();
		} else if (action === "back-locations") {
			currentLocationId = "";
			render();
		} else if (action === "talk")
			talk(
				target.getAttribute("data-character"),
				target.getAttribute("data-location"),
			);
		else if (action === "interaction-choice") {
			var interactionResult = runtime.resolveInteraction(
				target.getAttribute("data-id"),
				target.getAttribute("data-choice"),
			);
			if (interactionResult.success) {
				currentInteraction = interactionResult.interaction;
				toastMessage("success", interactionResult.choice.reply);
			} else toastMessage("error", interactionResult.error);
			render();
		} else if (action === "interaction-back") {
			currentInteraction = null;
			render();
		}
	}
	function bindDeskCard(card, characterId, locationId) {
		if (!card || card.getAttribute("data-immersive-bound") === "1") return;
		card.setAttribute("data-immersive-bound", "1");
		card.setAttribute("tabindex", "0");
		card.classList.add("immersive-clickable");
		var hint = global.document.createElement("span");
		hint.className = "immersive-click-hint";
		hint.textContent = "Clicca per interagire →";
		card.appendChild(hint);
		var activate = () => {
			open("locations");
			if (characterId) talk(characterId, locationId);
			else {
				currentLocationId = locationId;
				render();
			}
		};
		card.addEventListener("click", activate);
		card.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				activate();
			}
		});
	}
	function enhanceDesk() {
		if (!runtime || !global.document) return;
		var scene = byId("brokerage-desk-scene");
		if (!scene) return;
		var cards = scene.querySelectorAll(".desk-card");
		if (!cards.length) return;
		var state =
			global.G && global.G.brokerCareer ? global.G.brokerCareer : null;
		var characters = runtime.getCharacters();
		var managementId = "";
		var keys = Object.keys(characters);
		for (var k = 0; k < keys.length; k++)
			if (characters[keys[k]].namespace === "management")
				managementId = keys[k];
		bindDeskCard(cards[0], managementId, "ceo-office");
		if (cards[1]) bindDeskCard(cards[1], "", "desk");
		var colleagues = state && state.colleagues ? state.colleagues : [];
		for (var i = 0; i < colleagues.length && cards[i + 2]; i++) {
			bindDeskCard(
				cards[i + 2],
				"colleague:" +
					String(colleagues[i].id || colleagues[i].name)
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "_")
						.replace(/^_+|_+$/g, ""),
				i % 2 === 0 ? "desk" : "corridor",
			);
		}
	}
	function observeDesk() {
		if (
			!global.BrokerageCareer ||
			!global.BrokerageCareer.render ||
			global.BrokerageCareer.__immersiveRenderWrapped
		)
			return;
		var originalRender = global.BrokerageCareer.render;
		global.BrokerageCareer.render = function () {
			var result = originalRender.apply(global.BrokerageCareer, arguments);
			enhanceDesk();
			updateBadge();
			return result;
		};
		global.BrokerageCareer.__immersiveRenderWrapped = true;
	}
	function install(immersiveRuntime) {
		if (immersiveRuntime) runtime = immersiveRuntime;
		if (!runtime || !global.document) return false;
		injectStyles();
		injectShell();
		observeDesk();
		enhanceDesk();
		updateBadge();
		if (!installed) {
			installed = true;
			global.addEventListener("wolf-immersive-update", () => {
				injectShell();
				updateBadge();
				enhanceDesk();
				if (
					byId("immersive-overlay") &&
					byId("immersive-overlay").classList.contains("show")
				)
					render();
			});
			global.document.addEventListener("keydown", (event) => {
				if (event.key === "Escape") close();
			});
			global.setTimeout(() => {
				injectShell();
				enhanceDesk();
				updateBadge();
			}, 150);
		}
		return true;
	}

	global.ImmersiveUI = {
		install: install,
		open: open,
		close: close,
		render: render,
		talk: (characterId, locationId) => {
			open("locations");
			talk(characterId, locationId || "desk");
		},
		enhanceDesk: enhanceDesk,
	};
	if (typeof module !== "undefined" && module.exports)
		module.exports = global.ImmersiveUI;
})(
	typeof window !== "undefined"
		? window
		: typeof global !== "undefined"
			? global
			: this,
);
