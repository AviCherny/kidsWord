# CLAUDE.md — Kids Word Project Map

> Auto-loaded every session. Read this before touching any file.

---

## ⚠️ CRITICAL: WHERE TO EDIT

There are TWO word-shooter codebases. **Always edit the platform version.**

| What you might think | What you should actually edit |
|---|---|
| `word-shooter/src/App.js` | ❌ Standalone prototype — NOT used in the app |
| `platform/src/games/WordShooter/index.js` | ✅ The real game |
| `platform/src/games/WordShooter/WordShooter.css` | ✅ The real styles |
| `platform/src/games/WordShooter/levels.js` | ✅ Word data |

Same rule applies to ALL games — they all live under `platform/src/games/`.

---

## Project Structure

```
Kids word/
├── platform/                        ← THE REAL APP (edit here)
│   └── src/
│       ├── App.js                   ← Hub routing, game registry
│       ├── games/
│       │   ├── WordShooter/         ← Shooting game (this project's focus)
│       │   │   ├── index.js
│       │   │   ├── WordShooter.css
│       │   │   └── levels.js
│       │   ├── BigVsSmall/
│       │   ├── MemoryGame/
│       │   ├── SocialSkills/
│       │   └── ... (other games)
│       ├── context/
│       │   └── LanguageContext.js   ← lang ('he'|'en'), dir ('rtl'|'ltr')
│       ├── i18n/
│       │   └── translations.js      ← t(lang, key) — UI strings
│       └── speak.js                 ← speak(word, lang, callback)
│
├── social-skills/                   ← Separate Capacitor/Android app
│   └── android/                     ← Only edit if working on Android build
│
├── word-shooter/                    ← ❌ OLD standalone prototype, ignore
├── big-vs-small/                    ← ❌ OLD standalone prototype, ignore
├── memory-game/                     ← ❌ OLD standalone prototype, ignore
└── platform/build/                  ← ❌ Generated, never edit manually
```

---

## Dev Server

Two instances of `npm start` run from `platform/` — both serve the same app.
- **localhost:3000** and **localhost:3001**
- Hot reload works but sometimes needs **Ctrl+Shift+R** to show changes
- `npm run build` in `platform/` for production build — not needed during dev

---

## Language System

- `lang` = `'he'` (Hebrew) or `'en'` (English) — comes from `useLanguage()` hook
- Word data always has both `word`/`label` (English) and `heWord`/`heLabel` (Hebrew)
- TTS: use `heSpeech` for words with known pronunciation issues (nikud)
- `t(lang, 'key')` for UI strings — add keys to `translations.js` if missing

---

## WordShooter Game — Key Details

### State / Phase flow
```
idle → speaking → waiting → shooting → feedback
                     ↑                    ↓
                   retry ←←←←←←←←←←← wrong answer
```

- `phase === 'retry'`: child must tap the glowing correct card before next round
- Missile timeout = CSS animation duration = **1.1s** (keep in sync if changing)
- Wrong answer: sidekick appears from right, correct card glows

### Word cycling
- `wordDeckRef` — deck shuffle: all words play once before repeating
- `lastTargetRef` — prevents same word twice in a row
- `wordsPerGame` — subset selected from `wordPool` per session

### Missile + Flame
- `Missile` component: flex column, 🚀 on top, 🔥 below
- After rotation, 🔥 always trails behind regardless of direction
- CSS: `ws-missile-travel` keyframe, duration **1.1s**

### Emoji animations (simulated GIFs)
- `EMOJI_ANIM` map in `index.js` → CSS class per word
- Currently animated: Bat (wing flap), Box (bounce/pop), Cap (wobble)
- Add more: add entry to `EMOJI_ANIM` + keyframe in `WordShooter.css`

### EN toggle
- `showEnglish` state — forces English labels on cards regardless of app language
- Does NOT change the spoken word (that's controlled by `lang`)

---

## Git Workflow (from global CLAUDE.md)
- New branch for every task: `feat/`, `fix/`, `experiment/`
- Push when done — don't wait to be asked
- Never work directly on `main`
 
## Task Diff Hygiene
- Keep the final task diff clean and minimal.
- Before finishing, remove obsolete files created by the old implementation if they are no longer used.
- Do not leave partial rename leftovers or duplicate game entries wired in two places.
- If unrelated local changes already exist, do not touch them unless the task requires it.
- At handoff, only task-related files should remain changed.
- Default finish flow:
- 1. Complete the task.
- 2. Ensure the remaining diff is intentional and task-related only.
- 3. Commit or otherwise explicitly resolve the task changes.
- 4. Only after the worktree is clean, sync/align with `main`.
- 5. Delete the old branch locally and remotely:
  ```
  git branch -d <branch-name>
  git push origin --delete <branch-name>
  ```
- Never run `git pull` or align to `main` on a dirty worktree unless explicitly requested.
