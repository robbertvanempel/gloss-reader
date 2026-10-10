# Gloss Reader

A quiet, standalone reading app with Dutch and English interfaces. Import an article, highlight a passage, ask a question in the margin, and keep your notes together. The sample essay and sample explanations are original product content. This project is independent of the service that inspired its design.

## Run locally

Python 3.10 or newer is the only server dependency. No Python packages or JavaScript build step are required.

```sh
cd gloss-reader
python3 server.py --port 8767
```

Open [localhost:8767](http://localhost:8767). On macOS, you can also double-click `Start Gloss.command`. Stop the server with Ctrl+C in its terminal. The server binds to `127.0.0.1` only.

## Reading

- Switch between **NL** and **EN** in the top bar. The choice is saved in your browser. The interface, sample essay, sample explanations, messages, export labels and default AI response language follow this setting. Imported articles and your own notes keep their original wording.
- Open the home screen through the logo or library button. Paste a public article URL or choose **Or paste your own text**. Blank lines create paragraphs; a paragraph starting with `## ` becomes a section heading.
- Select text to ask a question, explain a passage, define a concept, highlight it or add your own note. Save an explanation with **Save** in the margin.
- Open the **Notebook** to revisit highlights, notes and saved explanations. **Export as Markdown** downloads a portable copy.
- **Aa** adjusts paper color, typeface, text size, line spacing and highlight color. **F** toggles focus mode; **Esc** returns to the normal view. The speaker button uses your browser's text-to-speech feature. Speech follows the article language when available.

## Connect AI

The sample essay includes clearly labelled, prewritten sample explanations. Free-form questions and summaries of imported text need a working model connection.

Open **AI settings** and choose:

- **OpenAI:** enter an API key and model name. The default is `gpt-4.1-mini`. Requests use the [Chat Completions API](https://developers.openai.com/api/reference/resources/chat).
- **Ollama:** run Ollama locally and download the model you select. The default model name is `llama3.2`. Requests use [Ollama's chat API](https://docs.ollama.com/api/chat) at `http://127.0.0.1:11434`.

Optional server environment variables: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `OLLAMA_URL` and `OLLAMA_MODEL`. Do not put credentials in source files.

## Data

The repository contains application code and generic example content. It does not contain browser storage, personal articles, notes, screenshots, credentials or local configuration.

Articles, notes and display preferences are saved in this browser's local storage. They are not synchronized between computers, and browser storage is not a backup. Export your notes to retain a separate copy.

An API key entered in settings stays in the active tab's memory and is sent to the local server when you ask a question. It is not written to browser storage. Reloading the tab clears that connection key.

Each AI request sends the selected passage, up to 65,000 characters of article text and recent conversation messages to your selected provider. Long articles may therefore have incomplete context. Fonts load from Google Fonts, with local font fallbacks when offline.

## Limits

Import extracts text from HTML without executing scripts. Login pages, paywalls, bot protection and pages that need JavaScript may require using the paste option instead. Some pages may include navigation or footnote text. This is a local app without accounts, shared storage or production hosting.

## Tests

```sh
python3 -m unittest test_server.py
node --check app.js
node --check i18n.js
```

Server tests cover article extraction, language metadata, exclusion of scripts and navigation, public URL validation, missing credentials, localized HTTP errors and OpenAI/Ollama request contracts using test doubles. Live model responses require a working provider connection.

## Nederlands

Start de app met `python3 server.py --port 8767` en open [localhost:8767](http://localhost:8767). Kies **NL** of **EN** bovenin. Je taalkeuze blijft bewaard in deze browser. Geïmporteerde artikelen en je eigen notities blijven in hun oorspronkelijke taal. Gebruik het tandwiel om OpenAI of een lokaal Ollama-model aan te sluiten. Via het notitieboek kun je je notities als Markdown exporteren.
