# Gloss Reader: step-by-step guide

This guide uses the English interface. Choose **EN** in the top bar before following the steps. The interface language is saved in your browser; switching it does not translate imported articles or your notes.

## Your first reading session

1. Start the local server with `python3 server.py --port 8767` from the app folder.
2. Open [http://localhost:8767](http://localhost:8767).
3. Choose **EN**, then open **Library**.
4. Choose **Try the sample** to explore the app without a model connection.
5. Open **At a glance** to see the sample summary.
6. Select a sentence and choose **Highlight**. A mark appears in the article, and the notebook count increases.
7. Choose **Try a sample explanation** to view the included example answer beside the article.
8. Choose **Save** under the answer to keep it. Choose **Your note** to add your own thought.
9. Open **Notebook** to revisit the saved items, then choose **Export as Markdown** for a separate copy.

The sample explanation is prewritten and labelled as such. It demonstrates the reading flow; it is not a live AI response.

## Open your own article

### From a URL

Open **Library**, paste a public article URL, and choose **Open article**. The local server downloads the HTML and extracts text. It does not sign in to sites or execute their page scripts. If import fails, use the paste option.

### From copied text

Choose **Or paste your own text**, enter a title, and paste the article. Add blank lines between paragraphs. For a heading, start a paragraph with `## `:

```text
A short opening paragraph goes here.

## A question worth asking

The next paragraph explores the idea in more detail.
```

Choose **Start reading**. Pasted text must contain at least 40 characters and no more than 160,000 characters. Use an excerpt for longer documents.

## Ask a useful question

Connect a model in **AI settings** first. Select the specific sentence or paragraph you want to discuss, then choose **Ask**. Try a question such as:

- “Explain this idea in simple terms.”
- “Give an example outside the writer's example.”
- “What assumption does this claim depend on?”
- “What would a critic of this argument say?”

The selected passage and article context are sent to the chosen provider. The margin keeps the explanation next to its source. You can continue the conversation or save the explanation to your notebook.

Treat explanations as help for your own reading. The assistant is instructed to distinguish the text's claims from its own explanation and to say when the source does not provide an answer.

## Connect OpenAI or Ollama

For **OpenAI**, enter your API key and a model name in **AI settings**, then choose **Use this connection**. The default model is `gpt-4.1-mini`. The entered key is held in the tab's memory rather than saved in your notebook. Re-enter it after reloading, unless a server-side key is configured.

For **Ollama**, start Ollama on this computer and make sure the model you want to use is already downloaded. Select **Ollama**, enter that model's exact name, and choose **Use this connection**. The app's default model name is `llama3.2`, and the default server address is `http://127.0.0.1:11434`.

The settings dialog configures the connection. It does not install Ollama or download models.

## Understand your notebook

**Highlights** contain the selected quote. **Your notes** include the quote and your own text. **Saved explanations** include the quote, question, and answer. The notebook combines these across articles.

Click a saved quote to return to the relevant article. Use the filters to find an item. The cross beside an item removes it from the notebook. **Export as Markdown** downloads all saved items, including their article titles and dates. An exported file is a separate readable copy; the app does not currently import Markdown backups.

## Reading controls

| Control | Use |
| --- | --- |
| NL / EN | Change the interface and default answer language. |
| Library or logo | Return to your reading table. |
| At a glance | Open or close the summary. |
| Contents | Jump to an article section on wider screens. |
| Aa | Adjust colors, font, text size, line spacing, and highlight color. |
| F | Toggle focus mode while reading. |
| Esc | Leave focus mode and close temporary reading panels. |
| Speaker | Start or stop browser text-to-speech. |
| Notebook | View and export saved items. |
| AI settings | Choose a model connection. |

Inside the question box, **Enter** sends the question and **Shift+Enter** starts a new line. Focus-mode shortcuts do not activate while typing in a form.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| The page does not open | Keep the server terminal running. Check that its port matches the URL. |
| The port is already in use | Open the existing server, or start this app with another port, such as `python3 server.py --port 8768`. A different port has separate browser storage. |
| A URL imports little or no text | Copy the article's text and use the paste option. The website may need JavaScript, a login, or another access method. |
| A question asks for a model connection | Open AI settings and configure OpenAI or Ollama. Only the sample essay includes prewritten explanations. |
| OpenAI rejects the key or model | Check the key, exact model name, and provider account in the provider's own interface. |
| Ollama is unreachable | Start Ollama and check that the selected model is installed. |
| A long article's answer lacks detail | Ask about a narrower passage or paste a shorter excerpt. Model context is limited to 65,000 article characters. |
| Read aloud is unavailable | Check the voices supported by your browser and operating system. |
| Notes are missing in another browser | Storage belongs to the original browser and web origin. There is no account synchronization. Use your exported Markdown copy. |

Return to the [README](../README.md) or watch the [English walkthrough](gloss-reader-walkthrough.mp4).
