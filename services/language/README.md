# Language analysis service

This optional private service enriches Arcuate texts with Stanza tokens, lemmas,
parts of speech, morphology, and source offsets. The web application falls back
to exact `Intl.Segmenter` analysis if the service is absent or unavailable.

Create an isolated Python environment, install `requirements.txt`, and download
only the language models you intend to support. For German:

```bash
python -c "import stanza; stanza.download('de', processors='tokenize,mwt,pos,lemma')"
python server.py
```

Set `LANGUAGE_ANALYZER_URL=http://127.0.0.1:8090` for `apps/web`. The service
binds to localhost by default and should remain private in deployed environments.
