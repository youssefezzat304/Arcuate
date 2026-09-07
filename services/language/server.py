import json
import os
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import stanza

ANALYSIS_VERSION = 1
MAX_CHARACTERS = int(os.environ.get("ARCUATE_ANALYZER_MAX_CHARACTERS", "20000"))
LANGUAGE_ALIASES = {"zh-Hans": "zh-hans", "zh-Hant": "zh-hant", "no": "nb"}


def morphology(value):
    if not value:
        return None
    return dict(item.split("=", 1) for item in value.split("|") if "=" in item)


def utf16_offset(text, codepoint_offset):
    return len(text[:codepoint_offset].encode("utf-16-le")) // 2


@lru_cache(maxsize=8)
def pipeline(language):
    return stanza.Pipeline(
        lang=LANGUAGE_ALIASES.get(language, language),
        processors="tokenize,mwt,pos,lemma",
        download_method=None,
        use_gpu=False,
        verbose=False,
    )


def analyze(paragraphs, language):
    result = []
    nlp = pipeline(language)
    for paragraph in paragraphs:
        document = nlp(paragraph)
        tokens = []
        for sentence_index, sentence in enumerate(document.sentences):
            for token in sentence.tokens:
                lexemes = []
                for word in token.words:
                    lexeme = {"lemma": word.lemma or word.text}
                    if word.upos:
                        lexeme["partOfSpeech"] = word.upos
                    features = morphology(word.feats)
                    if features:
                        lexeme["morphology"] = features
                    lexemes.append(lexeme)
                if lexemes and not all(item.get("partOfSpeech") in {"PUNCT", "SYM"} for item in lexemes):
                    tokens.append({
                        "start": utf16_offset(paragraph, token.start_char),
                        "end": utf16_offset(paragraph, token.end_char),
                        "sentenceIndex": sentence_index,
                        "lexemes": lexemes,
                    })
        result.append(tokens)
    return {"language": language, "analyzer": "stanza", "version": ANALYSIS_VERSION, "paragraphs": result}


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/analyze":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_CHARACTERS * 4:
                raise ValueError("Invalid request size")
            body = json.loads(self.rfile.read(length))
            paragraphs = body["paragraphs"]
            language = body["language"]
            if not isinstance(paragraphs, list) or not all(isinstance(item, str) for item in paragraphs):
                raise ValueError("Invalid paragraphs")
            if not isinstance(language, str) or sum(map(len, paragraphs)) > MAX_CHARACTERS:
                raise ValueError("Invalid language or text length")
            payload = json.dumps(analyze(paragraphs, language), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            self.send_error(400, str(error))
        except Exception:
            self.send_error(503, "Language model unavailable")

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8090"))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
