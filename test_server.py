import json
import os
import unittest
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from server import ArticleParser, Handler, ai_answer, public_url


class ReaderTests(unittest.TestCase):
    def test_extraction_prefers_article_and_drops_active_content(self):
        parser = ArticleParser()
        prose = "Deze alinea beschrijft een interessante gedachte die we zelf moeten onderzoeken. " * 5
        parser.feed(f'<html><head><title>Site</title><meta property="og:title" content="Een essay"></head><body><nav><p>Menu buiten de tekst</p></nav><article><h1>Een essay</h1><p>{prose}<script>secret()</script></p><h2>Tussenkop</h2><p>{prose}</p></article><footer><p>Copyright</p></footer></body></html>')
        result = parser.result('https://example.com/essay')
        self.assertEqual(result['title'], 'Een essay')
        self.assertEqual([b['type'] for b in result['blocks']], ['p', 'h2', 'p'])
        text = ' '.join(b['text'] for b in result['blocks'])
        self.assertNotIn('secret', text)
        self.assertNotIn('Menu', text)
        self.assertNotIn('Copyright', text)

    def test_too_little_content_has_an_actionable_error(self):
        parser = ArticleParser()
        parser.feed('<p>Login vereist</p>')
        with self.assertRaisesRegex(ValueError, 'tekst plakken'):
            parser.result('https://example.com')

    def test_private_urls_are_rejected(self):
        private = [(socket_family, 1, 6, '', ('127.0.0.1', 80)) for socket_family in [2]]
        with patch('server.socket.getaddrinfo', return_value=private):
            with self.assertRaisesRegex(ValueError, 'openbare'):
                public_url('http://localhost/private')
        for url in ['file:///etc/passwd', 'https://user:pass@example.com', 'http://example.com:8767']:
            with self.assertRaises(ValueError):
                public_url(url)

    def test_missing_key_does_not_fabricate_an_answer(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, 'Sluit AI aan'):
                ai_answer({'question': 'Wat betekent dit?', 'article': 'Brontekst'})

    def test_openai_context_and_response_contract(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, size): return json.dumps({'choices': [{'message': {'content': 'Een helder antwoord.'}}]}).encode()
        with patch.dict(os.environ, {}, clear=True), patch('server.urllib.request.urlopen', return_value=Response()) as request:
            answer = ai_answer({'apiKey': 'TEST-ONLY', 'question': 'Leg uit', 'article': 'Brontekst', 'selection': 'Passage', 'history': [{'role':'assistant','content':'Eerdere uitleg'}]})
        self.assertEqual(answer['answer'], 'Een helder antwoord.')
        req = request.call_args.args[0]
        body = json.loads(req.data)
        self.assertEqual(req.full_url, 'https://api.openai.com/v1/chat/completions')
        self.assertEqual(body['messages'][-1]['content'], 'Leg uit')
        self.assertIn('Brontekst', body['messages'][1]['content'])
        self.assertIn('Passage', body['messages'][1]['content'])
        self.assertIn('onbetrouwbare brondata', body['messages'][0]['content'])

    def test_ollama_contract_and_empty_model_response(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, size): return b'{"message":{"content":"Lokaal antwoord"}}'
        with patch.dict(os.environ, {}, clear=True), patch('server.urllib.request.urlopen', return_value=Response()) as request:
            result = ai_answer({'provider': 'ollama', 'model': 'local-model', 'question': 'Vraag'})
        self.assertEqual(result['answer'], 'Lokaal antwoord')
        body = json.loads(request.call_args.args[0].data)
        self.assertFalse(body['stream'])
        self.assertEqual(body['model'], 'local-model')

    def test_english_ai_request_uses_english_system_prompt(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, size): return b'{"choices":[{"message":{"content":"An explanation."}}]}'
        with patch.dict(os.environ, {}, clear=True), patch('server.urllib.request.urlopen', return_value=Response()) as request:
            result = ai_answer({'apiKey':'TEST-ONLY','language':'en','question':'Explain this','article':'Source text'})
        system = json.loads(request.call_args.args[0].data)['messages'][0]['content']
        self.assertIn('in English', system)
        self.assertIn('untrusted source data', system)
        self.assertEqual(result['answer'], 'An explanation.')

    def test_article_language_is_preserved(self):
        parser = ArticleParser()
        parser.feed('<html lang="en-GB"><article><p>' + 'A thoughtful article paragraph. ' * 20 + '</p></article></html>')
        self.assertEqual(parser.result('https://example.com/essay')['language'], 'en-GB')

    def test_http_errors_follow_selected_language_without_a_key(self):
        class QuietHandler(Handler):
            def log_message(self, *args): pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with patch.dict(os.environ, {}, clear=True):
                for language, expected in [('en','Connect AI in settings'),('nl','Sluit AI aan via de instellingen')]:
                    request = urllib.request.Request(
                        f'http://127.0.0.1:{server.server_port}/api/ask',
                        data=json.dumps({'language':language,'question':'A question'}).encode(),
                        headers={'Content-Type':'application/json'},method='POST')
                    with self.assertRaises(urllib.error.HTTPError) as response:
                        urllib.request.urlopen(request, timeout=3)
                    self.assertEqual(response.exception.code, 400)
                    self.assertIn(expected, json.load(response.exception)['error'])
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)


if __name__ == '__main__':
    unittest.main()
