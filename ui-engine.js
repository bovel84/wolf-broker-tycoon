/**
 * UIEngine - Advanced UI/UX Engine for Wolf of Wall Street Game
 * Vanilla JS + CSS injected dynamically
 * Exposes window.UIEngine
 */
(function (global) {
  'use strict';

  // ─── COLOR PALETTE ───────────────────────────────────────────────
  const COLORS = {
    gold: '#d4af37',
    goldBright: '#ffd700',
    goldDark: '#8b7d1f',
    black: '#0a0a0a',
    blackSoft: '#141414',
    nightBlue: '#0b1e3b',
    nightBlueLight: '#142d52',
    bloodRed: '#8b0000',
    bloodRedBright: '#dc143c',
    leather: '#2b1d0e',
    brass: '#b5832a',
    woodDark: '#1a1208',
    green: '#2ecc71',
    greenDark: '#27ae60',
    yellow: '#f1c40f',
    red: '#e74c3c',
    redDark: '#c0392b',
    blue: '#3498db',
    white: '#f5f5f5',
    gray: '#7f8c8d',
    grayLight: '#bdc3c7',
    glassBg: 'rgba(20, 30, 48, 0.65)',
    glassBorder: 'rgba(212, 175, 55, 0.3)',
  };

  // ─── CSS INJECTION ───────────────────────────────────────────────
  const CSS = '\n/* ===== ROOT VARIABLES ===== */\n.ui-engine-root {\n  --ue-gold: ' + (COLORS.gold) + ';\n  --ue-gold-bright: ' + (COLORS.goldBright) + ';\n  --ue-black: ' + (COLORS.black) + ';\n  --ue-night-blue: ' + (COLORS.nightBlue) + ';\n  --ue-blood-red: ' + (COLORS.bloodRed) + ';\n  --ue-leather: ' + (COLORS.leather) + ';\n  --ue-brass: ' + (COLORS.brass) + ';\n  --ue-wood: ' + (COLORS.woodDark) + ';\n  --ue-green: ' + (COLORS.green) + ';\n  --ue-yellow: ' + (COLORS.yellow) + ';\n  --ue-red: ' + (COLORS.red) + ';\n  --ue-blue: ' + (COLORS.blue) + ';\n  --ue-glass-bg: ' + (COLORS.glassBg) + ';\n  --ue-glass-border: ' + (COLORS.glassBorder) + ';\n  font-family: \'Georgia\', \'Times New Roman\', serif;\n}\n\n/* ===== RESETS ===== */\n.ui-engine-root * { box-sizing: border-box; margin: 0; padding: 0; }\n.ui-engine-root { position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 999998; pointer-events: none; }\n\n/* ===== ANIMATIONS ===== */\n@keyframes ueSlideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }\n@keyframes ueSlideInLeft { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }\n@keyframes ueSlideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n@keyframes ueSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }\n@keyframes ueFadeIn { from { opacity: 0; } to { opacity: 1; } }\n@keyframes ueFadeOut { from { opacity: 1; } to { opacity: 0; } }\n@keyframes uePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }\n@keyframes uePulseRed { 0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,0); } 50% { box-shadow: 0 0 20px 5px rgba(231,76,60,0.7); } }\n@keyframes uePulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(46,204,113,0); } 50% { box-shadow: 0 0 20px 5px rgba(46,204,113,0.7); } }\n@keyframes uePulseGold { 0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); } 50% { box-shadow: 0 0 25px 6px rgba(212,175,55,0.8); } }\n@keyframes ueGoldFlash { 0% { background: rgba(212,175,55,0); } 30% { background: rgba(212,175,55,0.25); } 100% { background: rgba(212,175,55,0); } }\n@keyframes ueShake { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-5px,-2px)} 20%{transform:translate(5px,2px)} 30%{transform:translate(-4px,1px)} 40%{transform:translate(4px,-1px)} 50%{transform:translate(-3px,2px)} 60%{transform:translate(3px,-2px)} 70%{transform:translate(-2px,1px)} 80%{transform:translate(2px,-1px)} 90%{transform:translate(-1px,0)} }\n@keyframes ueSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n@keyframes ueBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }\n@keyframes ueConfettiFall { 0% { transform: translateY(-10px) rotateZ(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotateZ(720deg); opacity: 0; } }\n@keyframes ueTypewriter { from { width: 0; } to { width: 100%; } }\n@keyframes ueScaleIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }\n@keyframes ueBarFill { from { width: 0; } }\n@keyframes ueFloatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-60px); opacity: 0; } }\n\n/* ===== MODAL BASE ===== */\n.ue-overlay {\n  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n  background: rgba(0,0,0,0.75);\n  display: flex; align-items: center; justify-content: center;\n  z-index: 999999; pointer-events: auto;\n  animation: ueFadeIn 0.3s ease;\n}\n.ue-overlay.ue-closing { animation: ueFadeOut 0.3s ease forwards; }\n\n.ue-modal {\n  background: linear-gradient(135deg, ' + (COLORS.nightBlue) + ' 0%, ' + (COLORS.blackSoft) + ' 100%);\n  border: 2px solid var(--ue-gold);\n  border-radius: 12px;\n  padding: 0;\n  max-width: 560px; width: 90%;\n  box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.15);\n  animation: ueScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\n  overflow: hidden;\n  position: relative;\n}\n.ue-modal::before {\n  content: \'\'; position: absolute; top: 0; left: 0; right: 0; height: 3px;\n  background: linear-gradient(90deg, transparent, var(--ue-gold), transparent);\n}\n\n/* ===== GLASS PANEL ===== */\n.ue-glass {\n  background: var(--ue-glass-bg);\n  backdrop-filter: blur(12px) saturate(1.4);\n  -webkit-backdrop-filter: blur(12px) saturate(1.4);\n  border: 1px solid var(--ue-glass-border);\n  border-radius: 10px;\n  box-shadow: 0 8px 32px rgba(0,0,0,0.4);\n}\n\n/* ===== TOAST NOTIFICATIONS ===== */\n.ue-toast-container {\n  position: fixed; top: 16px; right: 16px;\n  display: flex; flex-direction: column; gap: 10px;\n  z-index: 1000000; pointer-events: auto;\n  max-width: 380px;\n}\n.ue-toast {\n  padding: 14px 20px;\n  border-radius: 8px;\n  color: ' + (COLORS.white) + ';\n  font-size: 14px;\n  font-family: \'Georgia\', serif;\n  display: flex; align-items: flex-start; gap: 10px;\n  box-shadow: 0 8px 24px rgba(0,0,0,0.5);\n  animation: ueSlideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);\n  cursor: pointer;\n  position: relative; overflow: hidden;\n  border-left: 4px solid;\n}\n.ue-toast.ue-closing { animation: ueSlideInRight 0.3s reverse forwards; }\n.ue-toast .ue-toast-icon { font-size: 20px; flex-shrink: 0; }\n.ue-toast .ue-toast-body { flex: 1; }\n.ue-toast .ue-toast-title { font-weight: bold; font-size: 14px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 1px; }\n.ue-toast .ue-toast-msg { font-size: 13px; opacity: 0.9; line-height: 1.4; }\n.ue-toast .ue-toast-close { font-size: 16px; cursor: pointer; opacity: 0.5; flex-shrink: 0; }\n.ue-toast .ue-toast-close:hover { opacity: 1; }\n.ue-toast.ue-success { background: linear-gradient(135deg, rgba(39,174,96,0.95), rgba(20,90,50,0.95)); border-left-color: ' + (COLORS.green) + '; }\n.ue-toast.ue-danger { background: linear-gradient(135deg, rgba(192,57,43,0.95), rgba(100,20,20,0.95)); border-left-color: ' + (COLORS.red) + '; }\n.ue-toast.ue-info { background: linear-gradient(135deg, rgba(52,152,219,0.95), rgba(25,80,120,0.95)); border-left-color: ' + (COLORS.blue) + '; }\n.ue-toast.ue-gold { background: linear-gradient(135deg, rgba(212,175,55,0.95), rgba(139,125,31,0.95)); border-left-color: ' + (COLORS.goldBright) + '; color: #1a1a1a; }\n.ue-toast.ue-gold .ue-toast-title, .ue-toast.ue-gold .ue-toast-msg { color: #1a1a1a; }\n\n/* ===== LOADING SPINNER ===== */\n.ue-spinner-overlay {\n  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n  background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;\n  z-index: 1000001; pointer-events: auto;\n}\n.ue-spinner {\n  width: 60px; height: 60px;\n  border: 4px solid rgba(212,175,55,0.2);\n  border-top-color: ' + (COLORS.gold) + ';\n  border-right-color: ' + (COLORS.goldBright) + ';\n  border-radius: 50%;\n  animation: ueSpin 0.8s linear infinite;\n}\n.ue-spinner-text {\n  color: ' + (COLORS.gold) + '; font-size: 14px; margin-top: 16px;\n  font-family: \'Georgia\', serif; letter-spacing: 2px; text-transform: uppercase;\n}\n\n/* ===== DIALOGUE MODAL (COMIC STYLE) ===== */\n.ue-dialogue-overlay {\n  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n  background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center;\n  z-index: 999999; pointer-events: auto;\n  animation: ueFadeIn 0.3s ease; padding-bottom: 40px;\n}\n.ue-dialogue-overlay.ue-closing { animation: ueFadeOut 0.3s ease forwards; }\n.ue-dialogue-box {\n  background: linear-gradient(135deg, ' + (COLORS.leather) + ', ' + (COLORS.woodDark) + ');\n  border: 3px solid ' + (COLORS.brass) + ';\n  border-radius: 16px;\n  padding: 24px 28px;\n  max-width: 620px; width: 92%;\n  box-shadow: 0 12px 40px rgba(0,0,0,0.7), inset 0 0 30px rgba(212,175,55,0.05);\n  animation: ueSlideUp 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);\n  position: relative;\n}\n.ue-dialogue-box::before {\n  content: \'\'; position: absolute; top: -2px; left: 20px; right: 20px; height: 2px;\n  background: linear-gradient(90deg, transparent, ' + (COLORS.gold) + ', transparent);\n}\n.ue-dialogue-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }\n.ue-dialogue-avatar {\n  font-size: 48px; width: 64px; height: 64px;\n  display: flex; align-items: center; justify-content: center;\n  background: rgba(212,175,55,0.12); border: 2px solid ' + (COLORS.gold) + ';\n  border-radius: 50%; flex-shrink: 0;\n}\n.ue-dialogue-name {\n  color: ' + (COLORS.gold) + '; font-size: 18px; font-weight: bold;\n  font-family: \'Georgia\', serif; letter-spacing: 1px; text-transform: uppercase;\n}\n.ue-dialogue-role {\n  color: ' + (COLORS.grayLight) + '; font-size: 12px; margin-top: 2px; font-style: italic;\n}\n.ue-dialogue-text {\n  color: ' + (COLORS.white) + '; font-size: 16px; line-height: 1.6;\n  font-family: \'Georgia\', serif; min-height: 60px; margin-bottom: 18px;\n  border-left: 3px solid ' + (COLORS.brass) + '; padding-left: 16px;\n}\n.ue-dialogue-text.ue-typewriter {\n  overflow: hidden; white-space: pre-wrap;\n}\n.ue-dialogue-choices { display: flex; flex-direction: column; gap: 10px; }\n.ue-dialogue-choice {\n  background: rgba(11,30,59,0.8); border: 1px solid ' + (COLORS.brass) + ';\n  color: ' + (COLORS.white) + '; padding: 12px 18px; border-radius: 8px;\n  cursor: pointer; font-family: \'Georgia\', serif; font-size: 14px;\n  text-align: left; transition: all 0.2s ease;\n}\n.ue-dialogue-choice:hover {\n  background: rgba(212,175,55,0.15); border-color: ' + (COLORS.gold) + ';\n  transform: translateX(6px);\n}\n.ue-dialogue-skip {\n  position: absolute; top: 12px; right: 16px;\n  color: ' + (COLORS.grayLight) + '; font-size: 12px; cursor: pointer;\n  opacity: 0.6;\n}\n.ue-dialogue-skip:hover { opacity: 1; color: ' + (COLORS.gold) + '; }\n\n/* Comic book style for dialogue - halftone dots, bold borders, speech bubble feel */\n.ue-dialogue-box.ue-comic {\n  border: 4px solid ' + (COLORS.black) + ';\n  border-radius: 20px;\n  box-shadow: 6px 6px 0 ' + (COLORS.black) + ', 0 12px 40px rgba(0,0,0,0.7);\n  background: linear-gradient(135deg, #f5e6c8 0%, #e8d5a3 100%);\n  position: relative;\n}\n.ue-dialogue-box.ue-comic::after {\n  content: \'\'; position: absolute; bottom: -16px; left: 60px;\n  width: 0; height: 0;\n  border-left: 16px solid transparent; border-right: 16px solid transparent;\n  border-top: 16px solid ' + (COLORS.black) + ';\n}\n.ue-dialogue-box.ue-comic .ue-dialogue-name { color: ' + (COLORS.black) + '; font-weight: 900; }\n.ue-dialogue-box.ue-comic .ue-dialogue-role { color: #555; }\n.ue-dialogue-box.ue-comic .ue-dialogue-text {\n  color: ' + (COLORS.black) + '; font-weight: 500; border-left: 4px solid ' + (COLORS.bloodRedBright) + ';\n  background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);\n  background-size: 8px 8px; padding: 12px 16px; border-radius: 6px;\n}\n.ue-dialogue-box.ue-comic .ue-dialogue-choice {\n  background: #fff; border: 2px solid ' + (COLORS.black) + '; color: ' + (COLORS.black) + '; font-weight: bold;\n  box-shadow: 3px 3px 0 ' + (COLORS.black) + ';\n}\n.ue-dialogue-box.ue-comic .ue-dialogue-choice:hover {\n  background: ' + (COLORS.goldBright) + '; transform: translate(3px, 3px); box-shadow: 0 0 0 ' + (COLORS.black) + ';\n}\n.ue-dialogue-box.ue-comic .ue-dialogue-avatar {\n  background: #fff; border: 3px solid ' + (COLORS.black) + '; box-shadow: 3px 3px 0 ' + (COLORS.black) + ';\n}\n\n/* ===== CHAPTER INTRO SCREEN ===== */\n.ue-chapter-overlay {\n  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n  background: radial-gradient(ellipse at center, ' + (COLORS.nightBlue) + ' 0%, ' + (COLORS.black) + ' 100%);\n  display: flex; flex-direction: column; align-items: center; justify-content: center;\n  z-index: 1000000; pointer-events: auto;\n  animation: ueFadeIn 0.5s ease;\n}\n.ue-chapter-overlay.ue-closing { animation: ueFadeOut 0.5s ease forwards; }\n.ue-chapter-num {\n  color: ' + (COLORS.gold) + '; font-size: 14px; letter-spacing: 8px;\n  text-transform: uppercase; font-family: \'Georgia\', serif;\n  margin-bottom: 12px; opacity: 0; animation: ueFadeIn 1s ease 0.3s forwards;\n}\n.ue-chapter-title {\n  color: ' + (COLORS.white) + '; font-size: 42px; font-weight: bold;\n  font-family: \'Georgia\', serif; text-align: center;\n  text-shadow: 0 0 30px rgba(212,175,55,0.4);\n  margin-bottom: 16px; max-width: 800px; padding: 0 40px;\n  opacity: 0; animation: ueFadeIn 1.2s ease 0.6s forwards;\n}\n.ue-chapter-subtitle {\n  color: ' + (COLORS.grayLight) + '; font-size: 18px; font-style: italic;\n  text-align: center; max-width: 600px; padding: 0 40px;\n  margin-bottom: 28px; opacity: 0; animation: ueFadeIn 1.2s ease 1s forwards;\n}\n.ue-chapter-image {\n  font-size: 80px; margin-bottom: 28px;\n  opacity: 0; animation: ueScaleIn 1s ease 0.8s forwards;\n}\n.ue-chapter-continue {\n  color: ' + (COLORS.gold) + '; font-size: 14px; letter-spacing: 2px;\n  text-transform: uppercase; cursor: pointer;\n  padding: 12px 32px; border: 1px solid ' + (COLORS.gold) + ';\n  border-radius: 30px; font-family: \'Georgia\', serif;\n  animation: ueBlink 2s ease infinite; opacity: 0;\n  animation: ueFadeIn 1s ease 1.8s forwards, ueBlink 2s ease 2s infinite;\n  transition: background 0.3s ease;\n}\n.ue-chapter-continue:hover { background: rgba(212,175,55,0.15); }\n\n/* ===== MISSION TRACKER ===== */\n.ue-mission-tracker {\n  position: fixed; top: 80px; right: 16px;\n  width: 320px; z-index: 999997; pointer-events: auto;\n}\n.ue-mission-tracker.ue-collapsed .ue-mission-body { display: none; }\n.ue-mission-header {\n  background: linear-gradient(135deg, ' + (COLORS.nightBlue) + ', ' + (COLORS.blackSoft) + ');\n  border: 1px solid ' + (COLORS.gold) + '; border-radius: 10px 10px 0 0;\n  padding: 10px 16px; cursor: pointer;\n  display: flex; align-items: center; justify-content: space-between;\n  color: ' + (COLORS.gold) + '; font-size: 13px; text-transform: uppercase;\n  letter-spacing: 1px; font-family: \'Georgia\', serif;\n}\n.ue-mission-body {\n  background: rgba(11,30,59,0.92); border: 1px solid ' + (COLORS.brass) + ';\n  border-top: none; border-radius: 0 0 10px 10px; padding: 12px;\n  backdrop-filter: blur(10px);\n}\n.ue-mission-item {\n  margin-bottom: 12px; padding: 10px; border-radius: 8px;\n  background: rgba(0,0,0,0.3); cursor: pointer; transition: background 0.2s ease;\n}\n.ue-mission-item:hover { background: rgba(212,175,55,0.08); }\n.ue-mission-item.ue-active { border-left: 3px solid ' + (COLORS.gold) + '; }\n.ue-mission-item.ue-completed { border-left: 3px solid ' + (COLORS.green) + '; opacity: 0.6; }\n.ue-mission-item.ue-failed { border-left: 3px solid ' + (COLORS.red) + '; opacity: 0.5; }\n.ue-mission-title { color: ' + (COLORS.white) + '; font-size: 13px; font-weight: bold; margin-bottom: 4px; }\n.ue-mission-desc { color: ' + (COLORS.grayLight) + '; font-size: 11px; margin-bottom: 8px; }\n.ue-mission-progress {\n  height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden;\n}\n.ue-mission-progress-bar {\n  height: 100%; background: linear-gradient(90deg, ' + (COLORS.gold) + ', ' + (COLORS.goldBright) + ');\n  border-radius: 3px; transition: width 0.5s ease;\n}\n.ue-mission-reward {\n  margin-top: 6px; font-size: 11px; color: ' + (COLORS.goldBright) + ';\n}\n.ue-mission-status {\n  font-size: 10px; text-transform: uppercase; letter-spacing: 1px;\n  padding: 2px 8px; border-radius: 10px; display: inline-block; margin-bottom: 4px;\n}\n.ue-mission-status.ue-active { background: rgba(212,175,55,0.2); color: ' + (COLORS.gold) + '; }\n.ue-mission-status.ue-completed { background: rgba(46,204,113,0.2); color: ' + (COLORS.green) + '; }\n.ue-mission-status.ue-failed { background: rgba(231,76,60,0.2); color: ' + (COLORS.red) + '; }\n\n/* ===== MORAL CHOICE MODAL ===== */\n.ue-moral-overlay {\n  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n  background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;\n  z-index: 999999; pointer-events: auto; animation: ueFadeIn 0.3s ease;\n}\n.ue-moral-overlay.ue-closing { animation: ueFadeOut 0.3s ease forwards; }\n.ue-moral-modal {\n  background: linear-gradient(135deg, ' + (COLORS.nightBlue) + ', ' + (COLORS.blackSoft) + ');\n  border: 2px solid ' + (COLORS.gold) + '; border-radius: 12px;\n  max-width: 580px; width: 90%; padding: 32px;\n  animation: ueScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\n  box-shadow: 0 20px 60px rgba(0,0,0,0.8);\n}\n.ue-moral-title {\n  color: ' + (COLORS.gold) + '; font-size: 22px; font-weight: bold;\n  text-align: center; margin-bottom: 8px; font-family: \'Georgia\', serif;\n  text-transform: uppercase; letter-spacing: 2px;\n}\n.ue-moral-question {\n  color: ' + (COLORS.white) + '; font-size: 16px; text-align: center;\n  margin-bottom: 24px; font-style: italic; line-height: 1.5;\n}\n.ue-moral-options { display: flex; flex-direction: column; gap: 12px; }\n.ue-moral-option {\n  background: rgba(11,30,59,0.8); border: 1px solid ' + (COLORS.brass) + ';\n  border-radius: 10px; padding: 16px; cursor: pointer;\n  transition: all 0.25s ease; font-family: \'Georgia\', serif;\n}\n.ue-moral-option:hover {\n  background: rgba(212,175,55,0.1); border-color: ' + (COLORS.gold) + ';\n  transform: scale(1.02);\n}\n.ue-moral-option-text { color: ' + (COLORS.white) + '; font-size: 15px; margin-bottom: 10px; }\n.ue-moral-option-impact { display: flex; gap: 12px; font-size: 12px; }\n.ue-moral-impact-pill {\n  padding: 3px 10px; border-radius: 12px; font-weight: bold;\n}\n.ue-moral-impact-pill.ue-positive { background: rgba(46,204,113,0.2); color: ' + (COLORS.green) + '; }\n.ue-moral-impact-pill.ue-negative { background: rgba(231,76,60,0.2); color: ' + (COLORS.red) + '; }\n.ue-moral-impact-pill.ue-neutral { background: rgba(52,152,219,0.2); color: ' + (COLORS.blue) + '; }\n.ue-moral-confirm {\n  margin-top: 20px; text-align: center;\n  color: ' + (COLORS.gold) + '; font-size: 12px; font-style: italic;\n  opacity: 0.7;\n}\n\n/* ===== REPUTATION DASHBOARD ===== */\n.ue-reputation-panel {\n  background: rgba(11,30,59,0.85); border: 1px solid ' + (COLORS.brass) + ';\n  border-radius: 10px; padding: 16px;\n  backdrop-filter: blur(10px);\n}\n.ue-rep-title {\n  color: ' + (COLORS.gold) + '; font-size: 14px; text-transform: uppercase;\n  letter-spacing: 2px; margin-bottom: 14px; text-align: center;\n  font-family: \'Georgia\', serif;\n}\n.ue-rep-bar-item { margin-bottom: 14px; }\n.ue-rep-bar-label {\n  display: flex; justify-content: space-between;\n  color: ' + (COLORS.white) + '; font-size: 12px; margin-bottom: 5px;\n  font-family: \'Georgia\', serif;\n}\n.ue-rep-bar-track {\n  height: 10px; background: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden;\n  position: relative; cursor: pointer;\n}\n.ue-rep-bar-fill {\n  height: 100%; border-radius: 5px; transition: width 0.6s ease, background 0.3s ease;\n  position: relative;\n}\n.ue-rep-bar-fill.ue-high { background: linear-gradient(90deg, ' + (COLORS.greenDark) + ', ' + (COLORS.green) + '); }\n.ue-rep-bar-fill.ue-medium { background: linear-gradient(90deg, #b7950b, ' + (COLORS.yellow) + '); }\n.ue-rep-bar-fill.ue-low { background: linear-gradient(90deg, ' + (COLORS.redDark) + ', ' + (COLORS.red) + '); }\n.ue-rep-tooltip {\n  position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);\n  background: rgba(0,0,0,0.9); color: ' + (COLORS.white) + ';\n  font-size: 11px; padding: 6px 12px; border-radius: 6px;\n  white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease;\n  margin-bottom: 6px; border: 1px solid ' + (COLORS.brass) + ';\n}\n.ue-rep-bar-track:hover .ue-rep-tooltip { opacity: 1; }\n\n/* ===== ETHICS BAR ===== */\n.ue-ethics-bar-container {\n  background: rgba(0,0,0,0.6); border: 1px solid ' + (COLORS.brass) + ';\n  border-radius: 20px; padding: 12px 16px;\n  display: flex; align-items: center; gap: 12px;\n}\n.ue-ethics-bar-label {\n  color: ' + (COLORS.gold) + '; font-size: 11px; text-transform: uppercase;\n  letter-spacing: 1px; font-family: \'Georgia\', serif; white-space: nowrap;\n}\n.ue-ethics-bar-track {\n  flex: 1; height: 14px; background: rgba(0,0,0,0.5); border-radius: 7px;\n  overflow: hidden; position: relative;\n}\n.ue-ethics-bar-fill {\n  height: 100%; border-radius: 7px; transition: width 0.5s ease, background 0.3s ease;\n}\n.ue-ethics-bar-icon {\n  font-size: 24px; transition: transform 0.3s ease;\n  animation: uePulse 2s ease infinite;\n}\n\n/* ===== ACHIEVEMENT POPUP ===== */\n.ue-achievement-popup {\n  position: fixed; right: 16px; top: 80px;\n  background: linear-gradient(135deg, rgba(212,175,55,0.95), rgba(139,125,31,0.95));\n  border: 2px solid ' + (COLORS.goldBright) + '; border-radius: 12px;\n  padding: 16px 20px; display: flex; align-items: center; gap: 14px;\n  box-shadow: 0 12px 40px rgba(212,175,55,0.4), 0 0 20px rgba(255,215,0,0.3);\n  animation: ueSlideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);\n  z-index: 1000000; pointer-events: auto; max-width: 360px;\n  color: #1a1a1a; cursor: pointer;\n}\n.ue-achievement-popup.ue-closing { animation: ueSlideInRight 0.4s reverse forwards; }\n.ue-achievement-icon { font-size: 36px; flex-shrink: 0; }\n.ue-achievement-body { flex: 1; }\n.ue-achievement-label {\n  font-size: 10px; text-transform: uppercase; letter-spacing: 2px;\n  font-weight: bold; margin-bottom: 2px;\n}\n.ue-achievement-title { font-size: 16px; font-weight: bold; margin-bottom: 3px; }\n.ue-achievement-desc { font-size: 12px; opacity: 0.8; }\n\n/* ===== DARK ACTIONS PANEL ===== */\n.ue-dark-panel {\n  background: linear-gradient(135deg, rgba(139,0,0,0.3), rgba(20,20,20,0.95));\n  border: 2px solid ' + (COLORS.bloodRed) + '; border-radius: 12px;\n  padding: 20px; box-shadow: 0 8px 32px rgba(139,0,0,0.3);\n  backdrop-filter: blur(10px);\n}\n.ue-dark-title {\n  color: ' + (COLORS.bloodRedBright) + '; font-size: 16px; text-transform: uppercase;\n  letter-spacing: 2px; text-align: center; margin-bottom: 4px;\n  font-family: \'Georgia\', serif; font-weight: bold;\n}\n.ue-dark-warning {\n  text-align: center; color: ' + (COLORS.red) + '; font-size: 11px;\n  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;\n  animation: ueBlink 1.5s ease infinite;\n}\n.ue-dark-action {\n  background: rgba(50,10,10,0.8); border: 1px solid ' + (COLORS.bloodRed) + ';\n  border-radius: 8px; padding: 14px; margin-bottom: 10px; cursor: pointer;\n  transition: all 0.2s ease; font-family: \'Georgia\', serif;\n}\n.ue-dark-action:hover { background: rgba(139,0,0,0.3); border-color: ' + (COLORS.bloodRedBright) + '; }\n.ue-dark-action-name { color: ' + (COLORS.white) + '; font-size: 14px; font-weight: bold; margin-bottom: 6px; }\n.ue-dark-action-row { display: flex; gap: 12px; font-size: 11px; }\n.ue-dark-risk { color: ' + (COLORS.red) + '; }\n.ue-dark-reward { color: ' + (COLORS.gold) + '; }\n.ue-dark-confirm {\n  background: rgba(139,0,0,0.5); border: 1px solid ' + (COLORS.bloodRedBright) + ';\n  border-radius: 6px; padding: 8px 14px; color: ' + (COLORS.white) + ';\n  font-size: 11px; cursor: pointer; margin-top: 8px;\n  text-transform: uppercase; letter-spacing: 1px; display: none;\n}\n.ue-dark-action.ue-armed .ue-dark-confirm { display: block; }\n.ue-dark-action.ue-armed { border-color: ' + (COLORS.bloodRedBright) + '; animation: uePulseRed 1s ease infinite; }\n\n/* ===== COMPANY DETAIL VIEW ===== */\n.ue-company-modal {\n  background: linear-gradient(135deg, ' + (COLORS.nightBlue) + ', ' + (COLORS.blackSoft) + ');\n  border: 2px solid ' + (COLORS.gold) + '; border-radius: 12px;\n  max-width: 640px; width: 92%; max-height: 85vh; overflow-y: auto;\n  animation: ueScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\n  box-shadow: 0 20px 60px rgba(0,0,0,0.8);\n}\n.ue-company-header {\n  padding: 20px 24px; border-bottom: 1px solid ' + (COLORS.brass) + ';\n  display: flex; align-items: center; justify-content: space-between;\n  background: linear-gradient(90deg, rgba(212,175,55,0.08), transparent);\n}\n.ue-company-name { color: ' + (COLORS.gold) + '; font-size: 22px; font-weight: bold; font-family: \'Georgia\', serif; }\n.ue-company-ticker { color: ' + (COLORS.grayLight) + '; font-size: 14px; margin-left: 8px; }\n.ue-company-price {\n  color: ' + (COLORS.white) + '; font-size: 28px; font-weight: bold;\n  font-family: \'Courier New\', monospace;\n}\n.ue-company-change { font-size: 14px; font-weight: bold; }\n.ue-company-change.ue-up { color: ' + (COLORS.green) + '; }\n.ue-company-change.ue-down { color: ' + (COLORS.red) + '; }\n.ue-company-body { padding: 20px 24px; }\n.ue-company-section { margin-bottom: 20px; }\n.ue-company-section-title {\n  color: ' + (COLORS.gold) + '; font-size: 12px; text-transform: uppercase;\n  letter-spacing: 2px; margin-bottom: 10px; font-family: \'Georgia\', serif;\n  border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 6px;\n}\n.ue-company-fundamentals { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n.ue-fund-item {\n  background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 14px;\n  border: 1px solid rgba(212,175,55,0.1);\n}\n.ue-fund-label { color: ' + (COLORS.grayLight) + '; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; }\n.ue-fund-value { color: ' + (COLORS.white) + '; font-size: 16px; font-family: \'Courier New\', monospace; font-weight: bold; }\n.ue-company-event {\n  padding: 8px 12px; background: rgba(0,0,0,0.3); border-left: 2px solid ' + (COLORS.brass) + ';\n  border-radius: 4px; margin-bottom: 6px; font-size: 12px; color: ' + (COLORS.white) + ';\n}\n.ue-company-event-date { color: ' + (COLORS.gold) + '; font-size: 10px; margin-right: 8px; }\n.ue-company-ratings { display: flex; gap: 8px; flex-wrap: wrap; }\n.ue-rating-pill {\n  padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold;\n}\n.ue-rating-buy { background: rgba(46,204,113,0.2); color: ' + (COLORS.green) + '; }\n.ue-rating-hold { background: rgba(241,196,15,0.2); color: ' + (COLORS.yellow) + '; }\n.ue-rating-sell { background: rgba(231,76,60,0.2); color: ' + (COLORS.red) + '; }\n.ue-company-chart-container { height: 120px; margin-bottom: 16px; position: relative; }\n.ue-company-trade-btn {\n  width: 100%; padding: 14px; border: none; border-radius: 8px;\n  font-size: 16px; font-weight: bold; text-transform: uppercase;\n  letter-spacing: 2px; cursor: pointer; font-family: \'Georgia\', serif;\n  transition: all 0.2s ease;\n}\n.ue-company-trade-btn.ue-buy { background: linear-gradient(135deg, ' + (COLORS.greenDark) + ', ' + (COLORS.green) + '); color: white; }\n.ue-company-trade-btn.ue-sell { background: linear-gradient(135deg, ' + (COLORS.redDark) + ', ' + (COLORS.red) + '); color: white; }\n.ue-company-trade-btn:hover { transform: scale(1.02); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }\n.ue-company-close {\n  position: absolute; top: 16px; right: 20px;\n  color: ' + (COLORS.grayLight) + '; font-size: 24px; cursor: pointer;\n  opacity: 0.6;\n}\n.ue-company-close:hover { opacity: 1; color: ' + (COLORS.gold) + '; }\n\n/* ===== BREAKING NEWS BANNER ===== */\n.ue-breaking-news {\n  position: fixed; top: 0; left: 0; width: 100vw;\n  background: linear-gradient(90deg, ' + (COLORS.bloodRed) + ', ' + (COLORS.bloodRedBright) + ', ' + (COLORS.bloodRed) + ');\n  color: ' + (COLORS.white) + '; padding: 14px 24px;\n  display: flex; align-items: center; gap: 16px;\n  z-index: 999998; pointer-events: auto;\n  animation: ueSlideDown 0.4s ease;\n  box-shadow: 0 4px 20px rgba(139,0,0,0.5);\n  cursor: pointer;\n}\n.ue-breaking-news.ue-closing { animation: ueSlideDown 0.3s reverse forwards; }\n.ue-breaking-label {\n  background: ' + (COLORS.white) + '; color: ' + (COLORS.bloodRed) + ';\n  padding: 3px 12px; border-radius: 4px; font-weight: bold;\n  font-size: 12px; text-transform: uppercase; letter-spacing: 2px;\n  flex-shrink: 0; animation: ueBlink 1s ease infinite;\n}\n.ue-breaking-text { flex: 1; font-size: 15px; font-family: \'Georgia\', serif; font-weight: bold; }\n.ue-breaking-close { font-size: 20px; cursor: pointer; opacity: 0.7; flex-shrink: 0; }\n.ue-breaking-close:hover { opacity: 1; }\n\n/* ===== CONFETTI ===== */\n.ue-confetti-piece {\n  position: fixed; width: 10px; height: 10px;\n  z-index: 1000001; pointer-events: none;\n  animation: ueConfettiFall 3s linear forwards;\n}\n\n/* ===== FLOATING TEXT ===== */\n.ue-float-text {\n  position: fixed; font-size: 20px; font-weight: bold; font-family: \'Courier New\', monospace;\n  z-index: 1000000; pointer-events: none;\n  animation: ueFloatUp 1.5s ease-out forwards;\n  text-shadow: 0 2px 8px rgba(0,0,0,0.8);\n}\n\n/* ===== SCREEN SHAKE ===== */\n.ue-screen-shake { animation: ueShake 0.5s ease; }\n\n/* ===== GOLD FLASH ===== */\n.ue-gold-flash { animation: ueGoldFlash 0.8s ease; }\n\n/* ===== PULSE EFFECTS ===== */\n.ue-pulse-red { animation: uePulseRed 0.6s ease; }\n.ue-pulse-green { animation: uePulseGreen 0.6s ease; }\n\n/* ===== RESPONSIVE ===== */\n@media (max-width: 1024px) {\n  .ue-mission-tracker { width: 260px; }\n}\n@media (max-width: 768px) {\n  .ue-mission-tracker { width: calc(100vw - 32px); top: auto; bottom: 60px; right: 16px; }\n  .ue-modal { width: 95%; }\n  .ue-company-modal { width: 95%; }\n  .ue-dialogue-box { width: 95%; padding: 18px; }\n  .ue-dialogue-text { font-size: 14px; }\n  .ue-company-fundamentals { grid-template-columns: 1fr; }\n  .ue-toast-container { left: 16px; right: 16px; max-width: none; }\n  .ue-achievement-popup { left: 16px; right: 16px; max-width: none; }\n  .ue-chapter-title { font-size: 28px; }\n}\n';

  // ─── STATE ────────────────────────────────────────────────────
  const state = {
    toasts: [],
    toastId: 0,
    spinnerActive: false,
    soundsEnabled: true,
    audioCtx: null,
  };

  // ─── DOM HELPERS ──────────────────────────────────────────────
  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function mount(node) {
    let root = document.querySelector('.ui-engine-root');
    if (!root) {
      root = el('div', 'ui-engine-root');
      document.body.appendChild(root);
    }
    root.appendChild(node);
    return node;
  }
  function unmount(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  // ─── CSS INJECTION ────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('ui-engine-css')) return;
    const style = document.createElement('style');
    style.id = 'ui-engine-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ─── SOUND ────────────────────────────────────────────────────
  function getAudioCtx() {
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return state.audioCtx;
  }
  function playSound(type) {
    if (!state.soundsEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    switch (type) {
      case 'success':
        o.frequency.setValueAtTime(523.25, now);
        o.frequency.setValueAtTime(659.25, now + 0.1);
        o.frequency.setValueAtTime(783.99, now + 0.2);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.start(now); o.stop(now + 0.4); break;
      case 'danger':
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, now);
        o.frequency.exponentialRampToValueAtTime(110, now + 0.3);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        o.start(now); o.stop(now + 0.35); break;
      case 'alert':
        o.type = 'square';
        o.frequency.setValueAtTime(880, now);
        o.frequency.setValueAtTime(660, now + 0.08);
        o.frequency.setValueAtTime(880, now + 0.16);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.start(now); o.stop(now + 0.3); break;
      case 'chime':
        o.frequency.setValueAtTime(880, now);
        o.frequency.setValueAtTime(1108.73, now + 0.12);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        o.start(now); o.stop(now + 0.5); break;
      case 'achievement':
        o.frequency.setValueAtTime(659.25, now);
        o.frequency.setValueAtTime(830.61, now + 0.1);
        o.frequency.setValueAtTime(1046.5, now + 0.2);
        o.frequency.setValueAtTime(1318.51, now + 0.3);
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o.start(now); o.stop(now + 0.6); break;
      case 'buzz':
        o.type = 'square';
        o.frequency.setValueAtTime(150, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.start(now); o.stop(now + 0.2); break;
      default: return;
    }
  }

  // ─── TOAST SYSTEM ─────────────────────────────────────────────
  function getToastContainer() {
    let c = document.querySelector('.ue-toast-container');
    if (!c) {
      c = el('div', 'ue-toast-container');
      mount(c);
    }
    return c;
  }
  function toast(message, opts) {
    opts = opts || {};
    const type = opts.type || 'info';
    const title = opts.title || type.toUpperCase();
    const icon = opts.icon || ({ success: '✅', danger: '⚠️', info: 'ℹ️', gold: '🏆' })[type] || 'ℹ️';
    const duration = opts.duration || 4000;
    const priority = opts.priority || 0;
    const sound = opts.sound;

    if (sound) playSound(sound);

    // Priority queue: breaking news (3) > achievement (2) > info (1)
    const t = {
      id: ++state.toastId,
      message, type, title, icon, priority,
      element: null, timer: null,
    };

    state.toasts.push(t);
    state.toasts.sort((a, b) => b.priority - a.priority);

    // Keep max 5
    while (state.toasts.length > 5) {
      const removed = state.toasts.pop();
      if (removed.timer) clearTimeout(removed.timer);
      if (removed.element) {
        removed.element.classList.add('ue-closing');
        setTimeout(() => unmount(removed.element), 300);
      }
    }

    // Re-render container
    renderToasts();

    // Auto-dismiss
    t.timer = setTimeout(() => dismissToast(t.id), duration);

    return t.id;
  }
  function renderToasts() {
    const c = getToastContainer();
    c.innerHTML = '';
    state.toasts.forEach(t => {
      if (!t.element) {
        t.element = el('div', 'ue-toast ue-' + t.type);
        t.element.innerHTML = '\n          <span class="ue-toast-icon">' + (t.icon) + '</span>\n          <div class="ue-toast-body">\n            <div class="ue-toast-title">' + (t.title) + '</div>\n            <div class="ue-toast-msg">' + (t.message) + '</div>\n          </div>\n          <span class="ue-toast-close">✕</span>\n        ';
        t.element.querySelector('.ue-toast-close').addEventListener('click', () => dismissToast(t.id));
      }
      c.appendChild(t.element);
    });
  }
  function dismissToast(id) {
    const idx = state.toasts.findIndex(t => t.id === id);
    if (idx < 0) return;
    const t = state.toasts[idx];
    if (t.timer) clearTimeout(t.timer);
    if (t.element) {
      t.element.classList.add('ue-closing');
      setTimeout(() => unmount(t.element), 300);
    }
    state.toasts.splice(idx, 1);
  }

  // ─── LOADING SPINNER ──────────────────────────────────────────
  function showSpinner(text) {
    hideSpinner();
    const overlay = el('div', 'ue-spinner-overlay');
    overlay.id = 'ue-spinner-overlay';
    overlay.innerHTML = '\n      <div style="text-align:center">\n        <div class="ue-spinner"></div>\n        <div class="ue-spinner-text">' + (text || 'LOADING...') + '</div>\n      </div>\n    ';
    mount(overlay);
    state.spinnerActive = true;
  }
  function hideSpinner() {
    const o = document.getElementById('ue-spinner-overlay');
    if (o) unmount(o);
    state.spinnerActive = false;
  }

  // ─── CONFETTI ────────────────────────────────────────────────
  function confetti(count) {
    count = count || 60;
    const colors = [COLORS.gold, COLORS.goldBright, COLORS.green, COLORS.red, COLORS.blue, COLORS.yellow];
    for (let i = 0; i < count; i++) {
      const piece = el('div', 'ue-confetti-piece');
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      mount(piece);
      setTimeout(() => unmount(piece), 4000);
    }
  }

  // ─── SCREEN EFFECTS ───────────────────────────────────────────
  function screenShake() {
    const body = document.body;
    body.classList.add('ue-screen-shake');
    setTimeout(() => body.classList.remove('ue-screen-shake'), 500);
  }
  function goldFlash() {
    const flash = el('div', 'ue-gold-flash');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;pointer-events:none;';
    mount(flash);
    setTimeout(() => unmount(flash), 800);
  }
  function pulseElement(element, color) {
    if (!element) return;
    const cls = color === 'red' ? 'ue-pulse-red' : 'ue-pulse-green';
    element.classList.add(cls);
    setTimeout(() => element.classList.remove(cls), 600);
  }
  function floatText(text, x, y, color) {
    const ft = el('div', 'ue-float-text');
    ft.textContent = text;
    ft.style.left = x + 'px';
    ft.style.top = y + 'px';
    ft.style.color = color || COLORS.green;
    mount(ft);
    setTimeout(() => unmount(ft), 1500);
  }

  // ─── DIALOGUE MODAL ───────────────────────────────────────────
  /**
   * @param {object} opts - { avatar, name, role, text, choices: [{text, callback}], typewriter: bool }
   */
  function showDialogue(opts) {
    opts = opts || {};
    const overlay = el('div', 'ue-dialogue-overlay');

    const box = el('div', 'ue-dialogue-box');
    if (opts.comic) box.classList.add('ue-comic');
    box.innerHTML = '\n      <div class="ue-dialogue-skip">Skip ▸</div>\n      <div class="ue-dialogue-header">\n        <div class="ue-dialogue-avatar">' + (opts.avatar || '🧑') + '</div>\n        <div>\n          <div class="ue-dialogue-name">' + (opts.name || 'Unknown') + '</div>\n          ' + (opts.role ? '<div class="ue-dialogue-role">' + (opts.role) + '</div>' : '') + '\n        </div>\n      </div>\n      <div class="ue-dialogue-text" id="ue-dialogue-text"></div>\n      <div class="ue-dialogue-choices" id="ue-dialogue-choices"></div>\n    ';

    overlay.appendChild(box);
    mount(overlay);

    const textEl = box.querySelector('#ue-dialogue-text');
    const choicesEl = box.querySelector('#ue-dialogue-choices');
    const skipEl = box.querySelector('.ue-dialogue-skip');

    let typingInterval = null;
    let fullText = opts.text || '';

    function typeText(txt, cb) {
      textEl.classList.add('ue-typewriter');
      textEl.textContent = '';
      let i = 0;
      typingInterval = setInterval(() => {
        if (i < txt.length) {
          textEl.textContent += txt[i];
          i++;
        } else {
          clearInterval(typingInterval);
          typingInterval = null;
          textEl.classList.remove('ue-typewriter');
          if (cb) cb();
        }
      }, 25);
    }

    function showChoices() {
      const choices = opts.choices || [];
      choicesEl.innerHTML = '';
      choices.forEach((choice, idx) => {
        const btn = el('div', 'ue-dialogue-choice');
        btn.innerHTML = '▸ ' + (choice.text);
        btn.addEventListener('click', () => {
          closeDialogue();
          if (choice.callback) choice.callback(idx);
        });
        choicesEl.appendChild(btn);
      });
    }

    skipEl.addEventListener('click', () => {
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
        textEl.textContent = fullText;
        textEl.classList.remove('ue-typewriter');
        showChoices();
      } else {
        closeDialogue();
      }
    });

    if (opts.typewriter) {
      typeText(fullText, showChoices);
    } else {
      textEl.textContent = fullText;
      showChoices();
    }

    function closeDialogue() {
      if (typingInterval) clearInterval(typingInterval);
      overlay.classList.add('ue-closing');
      setTimeout(() => unmount(overlay), 300);
    }

    return { close: closeDialogue };
  }

  // ─── CHAPTER INTRO SCREEN ─────────────────────────────────────
  /**
   * @param {object} opts - { chapter, title, subtitle, image, onContinue }
   */
  function showChapterIntro(opts) {
    opts = opts || {};
    const overlay = el('div', 'ue-chapter-overlay');
    overlay.innerHTML = '\n      <div class="ue-chapter-num">' + (opts.chapter || 'CAPITOLO 1') + '</div>\n      <div class="ue-chapter-image">' + (opts.image || '📈') + '</div>\n      <div class="ue-chapter-title">' + (opts.title || 'The Beginning') + '</div>\n      <div class="ue-chapter-subtitle">' + (opts.subtitle || '') + '</div>\n      <div class="ue-chapter-continue">Premi per continuare ▸</div>\n    ';
    mount(overlay);

    const continueBtn = overlay.querySelector('.ue-chapter-continue');
    continueBtn.addEventListener('click', () => {
      overlay.classList.add('ue-closing');
      setTimeout(() => {
        unmount(overlay);
        if (opts.onContinue) opts.onContinue();
      }, 500);
    });

    // Also allow click anywhere to continue after 2s
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        continueBtn.click();
      }
    });

    return { close: () => { unmount(overlay); if (opts.onContinue) opts.onContinue(); } };
  }

  // ─── MISSION TRACKER ──────────────────────────────────────────
  /**
   * @param {object} opts - { missions: [{ id, title, desc, progress (0-100), status, reward }], collapsed }
   * @returns {object} controller with update(id, data), setCollapsed(bool), destroy()
   */
  function createMissionTracker(opts) {
    opts = opts || {};
    const panel = el('div', 'ue-mission-tracker');
    if (opts.collapsed) panel.classList.add('ue-collapsed');

    function render(missions) {
      const headerText = '📋 MISSIONS (' + (missions.filter(m => m.status === 'active').length) + ')';
      let bodyHTML = '';
      missions.forEach(m => {
        const statusClass = m.status === 'active' ? 'ue-active' : m.status === 'completed' ? 'ue-completed' : 'ue-failed';
        const statusLabel = m.status === 'active' ? 'ATTIVA' : m.status === 'completed' ? 'COMPLETATA' : 'FALLITA';
        const progress = m.progress || 0;
        bodyHTML += '\n          <div class="ue-mission-item ' + (statusClass) + '" data-mission-id="' + (m.id) + '">\n            <span class="ue-mission-status ' + (statusClass) + '">' + (statusLabel) + '</span>\n            <div class="ue-mission-title">' + (m.title) + '</div>\n            <div class="ue-mission-desc">' + (m.desc || '') + '</div>\n            <div class="ue-mission-progress">\n              <div class="ue-mission-progress-bar" style="width:' + (progress) + '%"></div>\n            </div>\n            ' + (m.reward ? '<div class="ue-mission-reward">💰 ' + (m.reward) + '</div>' : '') + '\n          </div>\n        ';
      });
      panel.innerHTML = '\n        <div class="ue-mission-header">\n          <span>' + (headerText) + '</span>\n          <span class="ue-toggle">' + (opts.collapsed ? '▼' : '▲') + '</span>\n        </div>\n        <div class="ue-mission-body">' + (bodyHTML) + '</div>\n      ';

      panel.querySelector('.ue-mission-header').addEventListener('click', () => {
        panel.classList.toggle('ue-collapsed');
        const toggle = panel.querySelector('.ue-toggle');
        if (toggle) toggle.textContent = panel.classList.contains('ue-collapsed') ? '▼' : '▲';
      });

      panel.querySelectorAll('.ue-mission-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.missionId;
          if (opts.onMissionClick) opts.onMissionClick(id);
        });
      });
    }

    render(opts.missions || []);
    mount(panel);

    return {
      update(id, data) {
        const missions = opts.missions || [];
        const m = missions.find(x => x.id === id);
        if (m) { Object.assign(m, data); render(missions); }
      },
      setAll(missions) { opts.missions = missions; render(missions); },
      setCollapsed(collapsed) { panel.classList.toggle('ue-collapsed', collapsed); },
      destroy() { unmount(panel); },
    };
  }

  // ─── MORAL CHOICE MODAL ────────────────────────────────────────
  /**
   * @param {object} opts - { title, question, options: [{ text, ethics (+/-), capital (+/-), callback }], onConfirm }
   */
  function showMoralChoice(opts) {
    opts = opts || {};
    const overlay = el('div', 'ue-moral-overlay');
    const modal = el('div', 'ue-moral-modal');
    modal.innerHTML = '\n      <div class="ue-moral-title">' + (opts.title || 'DECISIONE MORALE') + '</div>\n      <div class="ue-moral-question">' + (opts.question || '') + '</div>\n      <div class="ue-moral-options" id="ue-moral-options"></div>\n      <div class="ue-moral-confirm">Le tue azioni hanno conseguenze... scegli con saggezza.</div>\n    ';
    overlay.appendChild(modal);
    mount(overlay);

    const optionsEl = modal.querySelector('#ue-moral-options');
    let selectedOption = null;

    opts.options = opts.options || [];
    opts.options.forEach((option, idx) => {
      const div = el('div', 'ue-moral-option');
      let impactHTML = '';
      if (option.ethics !== undefined) {
        const cls = option.ethics > 0 ? 'ue-positive' : option.ethics < 0 ? 'ue-negative' : 'ue-neutral';
        const sign = option.ethics > 0 ? '+' : '';
        impactHTML += '<span class="ue-moral-impact-pill ' + (cls) + '">Etica ' + (sign) + (option.ethics) + '</span>';
      }
      if (option.capital !== undefined) {
        const cls = option.capital > 0 ? 'ue-positive' : option.capital < 0 ? 'ue-negative' : 'ue-neutral';
        const sign = option.capital > 0 ? '+' : '';
        impactHTML += '<span class="ue-moral-impact-pill ' + (cls) + '">Capitale ' + (sign) + '$' + (Math.abs(option.capital)) + '</span>';
      }
      div.innerHTML = '\n        <div class="ue-moral-option-text">' + (option.text) + '</div>\n        <div class="ue-moral-option-impact">' + (impactHTML) + '</div>\n      ';

      div.addEventListener('click', () => {
        // Confirmation: first click selects, second confirms
        if (selectedOption === idx) {
          // Confirm
          overlay.classList.add('ue-closing');
          setTimeout(() => {
            unmount(overlay);
            if (option.callback) option.callback(option);
            if (opts.onConfirm) opts.onConfirm(option, idx);
          }, 300);
        } else {
          selectedOption = idx;
          optionsEl.querySelectorAll('.ue-moral-option').forEach((o, i) => {
            o.style.borderColor = i === idx ? COLORS.gold : COLORS.brass;
            o.style.background = i === idx ? 'rgba(212,175,55,0.1)' : 'rgba(11,30,59,0.8)';
          });
        }
      });
      optionsEl.appendChild(div);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('ue-closing');
        setTimeout(() => unmount(overlay), 300);
      }
    });

    return { close: () => { unmount(overlay); } };
  }

  // ─── REPUTATION DASHBOARD ────────────────────────────────────
  /**
   * @param {object} opts - { values: { sec, clients, wallStreet, underworld }, tooltips }
   * @returns controller with update(values), getElement()
   */
  function createReputationDashboard(opts) {
    opts = opts || {};
    const panel = el('div', 'ue-reputation-panel');
    panel.innerHTML = '<div class="ue-rep-title">REPUTATION</div>';

    const keys = [
      { key: 'sec', label: 'SEC', tooltip: 'Reputazione con la Securities & Exchange Commission' },
      { key: 'clients', label: 'Clienti', tooltip: 'Reputazione con la tua clientela' },
      { key: 'wallStreet', label: 'Wall Street', tooltip: 'Reputazione tra i colleghi di Wall Street' },
      { key: 'underworld', label: 'Sottovalenti', tooltip: 'Reputazione nel mondo criminale' },
    ];

    const tooltips = opts.tooltips || {};

    function render(values) {
      let html = '<div class="ue-rep-title">REPUTATION</div>';
      keys.forEach(k => {
        const val = Math.max(0, Math.min(100, (values[k.key] || 0)));
        const cls = val >= 67 ? 'ue-high' : val >= 34 ? 'ue-medium' : 'ue-low';
        const tt = tooltips[k.key] || k.tooltip;
        html += '\n          <div class="ue-rep-bar-item">\n            <div class="ue-rep-bar-label"><span>' + (k.label) + '</span><span>' + (val) + '%</span></div>\n            <div class="ue-rep-bar-track">\n              <div class="ue-rep-bar-fill ' + (cls) + '" style="width:' + (val) + '%"></div>\n              <div class="ue-rep-tooltip">' + (tt) + '</div>\n            </div>\n          </div>\n        ';
      });
      panel.innerHTML = html;
    }

    render(opts.values || {});
    mount(panel);

    return {
      update(values) { render(values); },
      getElement() { return panel; },
      destroy() { unmount(panel); },
    };
  }

  // ─── ETHICS BAR ───────────────────────────────────────────────
  /**
   * @param {number} value 0-100
   * @returns controller with update(val), getElement()
   */
  function createEthicsBar(opts) {
    opts = opts || {};
    const container = el('div', 'ue-ethics-bar-container');
    container.innerHTML = '\n      <span class="ue-ethics-bar-label">ETICA</span>\n      <div class="ue-ethics-bar-track">\n        <div class="ue-ethics-bar-fill" id="ue-ethics-fill"></div>\n      </div>\n      <span class="ue-ethics-bar-icon" id="ue-ethics-icon">😐</span>\n    ';
    mount(container);

    function update(val) {
      val = Math.max(0, Math.min(100, val));
      const fill = container.querySelector('#ue-ethics-fill');
      const icon = container.querySelector('#ue-ethics-icon');
      let color, face;
      if (val <= 30) { color = 'linear-gradient(90deg, ' + (COLORS.redDark) + ', ' + (COLORS.red) + ')'; face = '😈'; }
      else if (val <= 60) { color = 'linear-gradient(90deg, #b7950b, ' + (COLORS.yellow) + ')'; face = '😐'; }
      else { color = 'linear-gradient(90deg, ' + (COLORS.greenDark) + ', ' + (COLORS.green) + ')'; face = '😇'; }
      fill.style.background = color;
      fill.style.width = val + '%';
      icon.textContent = face;
    }

    update(opts.value || 50);

    return { update, getElement: () => container, destroy: () => unmount(container) };
  }

  // ─── ACHIEVEMENT POPUP ────────────────────────────────────────
  /**
   * @param {object} opts - { icon, title, desc }
   */
  function showAchievement(opts) {
    opts = opts || {};
    playSound('achievement');
    confetti(40);
    goldFlash();

    const popup = el('div', 'ue-achievement-popup');
    popup.innerHTML = '\n      <div class="ue-achievement-icon">' + (opts.icon || '🏆') + '</div>\n      <div class="ue-achievement-body">\n        <div class="ue-achievement-label">ACHIEVEMENT UNLOCKED</div>\n        <div class="ue-achievement-title">' + (opts.title || 'Unknown') + '</div>\n        <div class="ue-achievement-desc">' + (opts.desc || '') + '</div>\n      </div>\n    ';
    mount(popup);

    popup.addEventListener('click', () => {
      popup.classList.add('ue-closing');
      setTimeout(() => unmount(popup), 400);
    });

    setTimeout(() => {
      if (popup.parentNode) {
        popup.classList.add('ue-closing');
        setTimeout(() => unmount(popup), 400);
      }
    }, 4000);

    return { close: () => { unmount(popup); } };
  }

  // ─── DARK ACTIONS PANEL ───────────────────────────────────────
  /**
   * @param {object} opts - { actions: [{ id, name, risk, reward, description, callback }], onAction }
   * @returns controller with update(actions), getElement(), destroy()
   */
  function createDarkActionsPanel(opts) {
    opts = opts || {};
    const panel = el('div', 'ue-dark-panel');
    let actions = opts.actions || [];

    function render() {
      let html = '\n        <div class="ue-dark-title">DARK ACTIONS</div>\n        <div class="ue-dark-warning">⚠ AZIONI ILLEGALI ⚠</div>\n      ';
      actions.forEach(a => {
        html += '\n          <div class="ue-dark-action" data-action-id="' + (a.id) + '">\n            <div class="ue-dark-action-name">' + (a.name) + '</div>\n            ' + (a.description ? '<div style="color:' + (COLORS.grayLight) + ';font-size:12px;margin-bottom:6px;">' + (a.description) + '</div>' : '') + '\n            <div class="ue-dark-action-row">\n              <span class="ue-dark-risk">Rischio: ' + (a.risk || '?') + '</span>\n              <span class="ue-dark-reward">Reward: ' + (a.reward || '?') + '</span>\n            </div>\n            <div class="ue-dark-confirm">CONFERMA ESECUZIONE ▸</div>\n          </div>\n        ';
      });
      panel.innerHTML = html;

      panel.querySelectorAll('.ue-dark-action').forEach(item => {
        const actionId = item.dataset.actionId;
        item.addEventListener('click', () => {
          if (item.classList.contains('ue-armed')) {
            // Second click = confirm
            const action = actions.find(a => a.id === actionId);
            playSound('danger');
            if (action && action.callback) action.callback(action);
            else if (opts.onAction) opts.onAction(action);
            item.classList.remove('ue-armed');
          } else {
            // First click = arm
            panel.querySelectorAll('.ue-dark-action').forEach(a => a.classList.remove('ue-armed'));
            item.classList.add('ue-armed');
          }
        });
      });
    }

    render();
    mount(panel);

    return {
      update(newActions) { actions = newActions; render(); },
      getElement() { return panel; },
      destroy() { unmount(panel); },
    };
  }

  // ─── COMPANY DETAIL VIEW ───────────────────────────────────────
  /**
   * @param {object} opts - { company: { name, ticker, price, change, fundamentals: {revenue, eps, pe, debt}, events: [{date, text}], ratings: [{type, label}], history: [prices] }, onBuy, onSell }
   * Requires Chart.js loaded in the page.
   */
  function showCompanyDetail(opts) {
    opts = opts || {};
    const c = opts.company || {};
    const overlay = el('div', 'ue-overlay');
    const modal = el('div', 'ue-company-modal');

    const changeCls = (c.change || 0) >= 0 ? 'ue-up' : 'ue-down';
    const changeSign = (c.change || 0) >= 0 ? '+' : '';
    const changePct = c.changePercent !== undefined ? ' (' + (changeSign) + (c.changePercent) + '%)' : '';

    let fundamentalsHTML = '';
    if (c.fundamentals) {
      const f = c.fundamentals;
      const items = [
        { label: 'Revenue', value: f.revenue !== undefined ? '$' + formatNum(f.revenue) : '—' },
        { label: 'EPS', value: f.eps !== undefined ? '$' + f.eps : '—' },
        { label: 'P/E Ratio', value: f.pe !== undefined ? f.pe : '—' },
        { label: 'Debt', value: f.debt !== undefined ? '$' + formatNum(f.debt) : '—' },
      ];
      items.forEach(item => {
        fundamentalsHTML += '\n          <div class="ue-fund-item">\n            <div class="ue-fund-label">' + (item.label) + '</div>\n            <div class="ue-fund-value">' + (item.value) + '</div>\n          </div>\n        ';
      });
    }

    let eventsHTML = '';
    if (c.events && c.events.length) {
      c.events.forEach(e => {
        eventsHTML += '<div class="ue-company-event"><span class="ue-company-event-date">' + (e.date || '') + '</span>' + (e.text || '') + '</div>';
      });
    } else {
      eventsHTML = '<div style="color:' + COLORS.grayLight + ';font-size:12px;">Nessun evento recente.</div>';
    }

    let ratingsHTML = '';
    if (c.ratings && c.ratings.length) {
      c.ratings.forEach(r => {
        const cls = r.type === 'buy' ? 'ue-rating-buy' : r.type === 'hold' ? 'ue-rating-hold' : 'ue-rating-sell';
        ratingsHTML += '<span class="ue-rating-pill ' + (cls) + '">' + (r.label || r.type.toUpperCase()) + '</span>';
      });
    } else {
      ratingsHTML = '<span style="color:' + COLORS.grayLight + ';font-size:12px;">Nessun rating disponibile.</span>';
    }

    modal.innerHTML = '\n      <div class="ue-company-header">\n        <div>\n          <span class="ue-company-name">' + (c.name || 'Unknown') + '</span>\n          <span class="ue-company-ticker">' + (c.ticker || '') + '</span>\n        </div>\n        <div style="text-align:right">\n          <div class="ue-company-price">$' + (formatNum(c.price || 0)) + '</div>\n          <div class="ue-company-change ' + (changeCls) + '">' + (changeSign) + (c.change || 0) + (changePct) + '</div>\n        </div>\n        <span class="ue-company-close">✕</span>\n      </div>\n      <div class="ue-company-body">\n        <div class="ue-company-section">\n          <div class="ue-company-section-title">PRICE CHART</div>\n          <div class="ue-company-chart-container">\n            <canvas id="ue-company-chart"></canvas>\n          </div>\n        </div>\n        <div class="ue-company-section">\n          <div class="ue-company-section-title">FUNDAMENTALS</div>\n          <div class="ue-company-fundamentals">' + (fundamentalsHTML) + '</div>\n        </div>\n        <div class="ue-company-section">\n          <div class="ue-company-section-title">RECENT EVENTS</div>\n          ' + (eventsHTML) + '\n        </div>\n        <div class="ue-company-section">\n          <div class="ue-company-section-title">ANALYST RATINGS</div>\n          <div class="ue-company-ratings">' + (ratingsHTML) + '</div>\n        </div>\n        <div style="display:flex;gap:12px;">\n          <button class="ue-company-trade-btn ue-buy" id="ue-company-buy">BUY</button>\n          <button class="ue-company-trade-btn ue-sell" id="ue-company-sell">SELL</button>\n        </div>\n      </div>\n    ';

    overlay.appendChild(modal);
    mount(overlay);

    const closeBtn = modal.querySelector('.ue-company-close');
    closeBtn.addEventListener('click', () => closeModal());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    const buyBtn = modal.querySelector('#ue-company-buy');
    const sellBtn = modal.querySelector('#ue-company-sell');
    buyBtn.addEventListener('click', () => { if (opts.onBuy) opts.onBuy(c); });
    sellBtn.addEventListener('click', () => { if (opts.onSell) opts.onSell(c); });

    // Render sparkline chart with Chart.js if available
    if (typeof Chart !== 'undefined' && c.history && c.history.length) {
      const ctx = modal.querySelector('#ue-company-chart').getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 120);
      gradient.addColorStop(0, 'rgba(212,175,55,0.3)');
      gradient.addColorStop(1, 'rgba(212,175,55,0)');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: c.history.map((_, i) => i),
          datasets: [{
            data: c.history,
            borderColor: COLORS.gold,
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverColor: COLORS.goldBright,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { display: false },
            y: { display: true, ticks: { color: COLORS.grayLight, font: { size: 10 } }, grid: { color: 'rgba(212,175,55,0.1)' } },
          },
        },
      });
    } else {
      const chartContainer = modal.querySelector('.ue-company-chart-container');
      chartContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:' + (COLORS.grayLight) + ';font-size:12px;">Grafico non disponibile</div>';
    }

    function closeModal() {
      overlay.classList.add('ue-closing');
      setTimeout(() => unmount(overlay), 300);
    }

    return { close: closeModal };
  }

  // ─── BREAKING NEWS BANNER ─────────────────────────────────────
  /**
   * @param {object} opts - { text, onClick, duration }
   */
  function showBreakingNews(opts) {
    opts = opts || {};
    playSound('alert');

    const banner = el('div', 'ue-breaking-news');
    banner.innerHTML = '\n      <span class="ue-breaking-label">BREAKING</span>\n      <span class="ue-breaking-text">' + (opts.text || 'Notizia importante') + '</span>\n      <span class="ue-breaking-close">✕</span>\n    ';
    mount(banner);

    const closeBtn = banner.querySelector('.ue-breaking-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBanner();
    });

    banner.addEventListener('click', () => {
      if (opts.onClick) opts.onClick();
      closeBanner();
    });

    const duration = opts.duration || 8000;
    const timer = setTimeout(closeBanner, duration);

    function closeBanner() {
      clearTimeout(timer);
      banner.classList.add('ue-closing');
      setTimeout(() => unmount(banner), 400);
    }

    return { close: closeBanner };
  }

  // ─── FORMAT NUMBER ────────────────────────────────────────────
  function formatNum(n) {
    if (n === null || n === undefined) return '0';
    if (typeof n !== 'number') n = parseFloat(n);
    if (isNaN(n)) return '0';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
  }

  // ─── GENERIC MODAL ────────────────────────────────────────────
  function showModal(opts) {
    opts = opts || {};
    const overlay = el('div', 'ue-overlay');
    const modal = el('div', 'ue-modal');
    modal.innerHTML = '\n      <div style="padding:28px;">\n        <div style="color:' + (COLORS.gold) + ';font-size:20px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-family:Georgia,serif;">' + (opts.title || '') + '</div>\n        <div style="color:' + (COLORS.white) + ';font-size:15px;line-height:1.6;margin-bottom:20px;">' + (opts.body || '') + '</div>\n        <div style="display:flex;gap:12px;justify-content:flex-end;">\n          ' + (opts.buttons ? opts.buttons.map((b, i) => '<button class="ue-company-trade-btn ' + (b.type === 'buy' ? 'ue-buy' : 'ue-sell') + '" style="padding:10px 24px;font-size:14px;width:auto;" data-btn-idx="' + (i) + '">' + (b.text) + '</button>').join('') : '<button class="ue-company-trade-btn ue-buy" style="padding:10px 24px;font-size:14px;width:auto;" id="ue-modal-ok">OK</button>') + '\n        </div>\n      </div>\n    ';
    overlay.appendChild(modal);
    mount(overlay);

    function close() { overlay.classList.add('ue-closing'); setTimeout(() => unmount(overlay), 300); }

    if (opts.buttons) {
      modal.querySelectorAll('[data-btn-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.btnIdx);
          if (opts.buttons[idx].callback) opts.buttons[idx].callback();
          close();
        });
      });
    } else {
      modal.querySelector('#ue-modal-ok').addEventListener('click', close);
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    return { close };
  }

  // ─── INIT ─────────────────────────────────────────────────────
  function init() {
    injectCSS();
  }

  // ─── EXPORT ────────────────────────────────────────────────────
  const UIEngine = {
    init,
    // Toasts
    toast,
    dismissToast,
    // Spinner
    showSpinner,
    hideSpinner,
    // Effects
    confetti,
    screenShake,
    goldFlash,
    pulseElement,
    floatText,
    // Components
    showDialogue,
    showChapterIntro,
    createMissionTracker,
    showMoralChoice,
    createReputationDashboard,
    createEthicsBar,
    showAchievement,
    createDarkActionsPanel,
    showCompanyDetail,
    showBreakingNews,
    showModal,
    // Sound
    playSound,
    setSoundsEnabled: (v) => { state.soundsEnabled = v; },
    // Colors
    COLORS,
  };

  if (typeof window !== 'undefined') {
    window.UIEngine = UIEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEngine;
  }

  // Auto-init on DOMContentLoaded or immediately if already loaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);