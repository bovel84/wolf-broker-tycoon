/*
 * Test Immersive Core: inbox, luoghi, scelte, conversazioni e persistenza.
 */
var assert = require("assert");
var GameEngine = require("../game-engine.js");
var NarrativeEngine = require("../llm-narrative-engine.js");

NarrativeEngine.configure({ enabled: false, endpoint: "", apiKey: "" });
global.LLMNarrativeEngine = NarrativeEngine;
global.G = {
	week: 1,
	brokerCareer: {
		status: "employed",
		employerId: "meridian",
		employerTrust: 48,
		contract: { role: "Junior Broker" },
		cycle: { score: 40, rank: 3 },
		colleagues: [
			{
				id: "meridian_ai_0",
				name: "Maya Voss",
				relationship: 52,
				ambition: 78,
				ethics: 61,
				politics: 45,
				score: 55,
				lastMove: "Ti propone di scambiare informazioni.",
			},
			{
				id: "meridian_ai_1",
				name: "Luca Chen",
				relationship: 35,
				ambition: 88,
				ethics: 29,
				politics: 82,
				score: 67,
				lastMove: "Sta parlando col management senza di te.",
			},
		],
	},
};
global.BrokerageCareer = {
	getContext: () => ({
		status: "employed",
		employer: "Meridian Capital Markets",
		role: "Junior Broker",
		employerTrust: global.G.brokerCareer.employerTrust,
		careerReputation: 25,
		currentScore: 40,
		currentRank: 3,
		employerMood: "vigile",
		employerAgenda: "Colpisci i target senza perdere il controllo.",
	}),
};

var ImmersiveEngine = require("../immersive-engine.js");

function run() {
	console.log("\nRunning immersive core tests...");
	var ge = new GameEngine();
	var state = ge.createInitialState("ImmersiveTest", "normal");

	console.log("  Installazione e messaggi iniziali");
	assert(ImmersiveEngine.install(ge), "ImmersiveEngine deve installarsi");
	var im = ImmersiveEngine.ensureState(state);
	assert(im, "Stato immersive mancante");
	assert(im.messages.length >= 2, "Devono esistere management e collega");
	assert(
		ImmersiveEngine.unreadCount() >= 2,
		"Messaggi iniziali devono essere non letti",
	);

	console.log("  Luoghi e personaggi interattivi");
	var locations = ImmersiveEngine.getLocations();
	var locationIds = locations.map((l) => l.id);
	assert(locationIds.indexOf("desk") >= 0, "Trading floor mancante");
	assert(locationIds.indexOf("corridor") >= 0, "Corridoio mancante");
	assert(locationIds.indexOf("meeting-room") >= 0, "Sala riunioni mancante");
	assert(locationIds.indexOf("ceo-office") >= 0, "Ufficio direzione mancante");
	var characters = ImmersiveEngine.getCharacters();
	assert(
		characters["colleague:meridian_ai_0"],
		"Collega non registrato come personaggio",
	);

	console.log("  Risposta a messaggio con effetti one-shot");
	var messages = ImmersiveEngine.getMessages({});
	var management = null;
	for (var i = 0; i < messages.length; i++)
		if (messages[i].type === "management") management = messages[i];
	assert(
		management && management.choices.length === 3,
		"Messaggio management senza 3 scelte",
	);
	var repBefore = state.player.reputation.wallStreet;
	var trustBefore = global.G.brokerCareer.employerTrust;
	var response = ImmersiveEngine.resolveMessage(management.id, "commit");
	assert(response.success, "Prima risposta deve riuscire");
	assert(
		state.player.reputation.wallStreet > repBefore,
		"Reputazione non modificata",
	);
	assert(
		global.G.brokerCareer.employerTrust > trustBefore,
		"Fiducia management non modificata",
	);
	assert(
		!ImmersiveEngine.resolveMessage(management.id, "commit").success,
		"Seconda risposta deve essere bloccata",
	);

	console.log("  Dialogo fallback e conversazione persistente");
	return ImmersiveEngine.beginInteraction(
		"colleague:meridian_ai_0",
		"corridor",
	).then((interaction) => {
		assert(interaction, "Interazione mancante");
		assert(interaction.source === "fallback", "Senza LLM deve usare fallback");
		assert(interaction.choices.length === 3, "Dialogo fallback senza 3 scelte");
		var resolved = ImmersiveEngine.resolveInteraction(
			interaction.id,
			interaction.choices[0].id,
		);
		assert(resolved.success, "Scelta dialogo non applicata");
		assert(
			ImmersiveEngine.getConversation("colleague:meridian_ai_0").length >= 2,
			"Conversazione non registrata",
		);

		console.log("  Persistenza save/load");
		var serialized = ge._serializeState();
		assert(
			serialized.narrative && serialized.narrative.immersive,
			"Immersive state non serializzato",
		);
		var serializedJson = "";
		try {
			serializedJson = JSON.stringify(serialized);
		} catch (stringifyError) {
			throw new Error(
				"Serializzazione immersive non valida: " + stringifyError.message,
			);
		}
		var restoredData = null;
		try {
			restoredData = JSON.parse(serializedJson);
		} catch (parseError) {
			throw new Error("Parsing immersive non valido: " + parseError.message);
		}
		var restored = ge._deserializeState(restoredData);
		assert(
			restored.narrative.immersive.messages.length ===
				state.narrative.immersive.messages.length,
			"Messaggi persi nel round-trip",
		);
		assert(
			restored.narrative.immersive.conversations["colleague:meridian_ai_0"]
				.length >= 2,
			"Conversazioni perse nel round-trip",
		);

		console.log("Immersive core tests passed.\n");
	});
}

run().catch((err) => {
	console.error("Immersive core tests failed:", err);
	process.exit(1);
});
