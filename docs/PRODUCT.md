# Product

## Core idea

Arcuate is a graded reader for language learners.

Users should be able to read about any subject they are interested in at an appropriate language-learning level.

The generated text should respect the selected language and CEFR level while remaining natural, informative, and enjoyable to read.

Example:

* Target language: German
* Level: A2
* Topic: How the Internet works
* Length: 4,000-character target
* Words to use: optional list of vocabulary the learner wants included

## MVP

The MVP includes:

* text generation from a user-provided topic
* CEFR level selection (`A1`–`C2`)
* target language selection
* text length selection
* optional vocabulary words to include
* reader view


## Reading library

Texts are saved automatically in the current browser using localStorage and can
be reopened from My texts without an account. Clearing site data removes them.
Account holders will eventually have cloud storage; authentication is deferred.

## Generation scope

Gemini generates the title and body in the selected language at the requested
CEFR level. Length is selected with a slider from 2,000 to 20,000 characters in 2,000-character
steps, defaulting to 4,000. Actual counts are displayed; exact length and CEFR conformity are
not independently enforced yet. Translation is deferred and has no current UI
or generation input.

Character counts include spaces, punctuation, and paragraph breaks, exclude the title, and count Unicode grapheme clusters (user-perceived characters).

## Saved words

Readers can bookmark a selected word or short phrase (up to 200 characters) into
an existing list or create a list while saving. Saved words shows each list and
its words, with language and links to the source reading. Lists are saved on the
current browser without an account.

The library initially shows only list names. Clicking a name opens its words and
actions to copy the list as Markdown, rename it, or delete it after confirmation.
Individual words can be removed; removing the final word keeps the empty list.

Saved words receive a bold, warm-underlined treatment everywhere they appear in
texts of the same language. Locale-aware exact-token matching is always
available. When the optional language-analysis service is configured, lemma and
part-of-speech annotations also allow inflected forms to match. Translation,
pronunciation, and grammar details remain planned uses of the same token data.

## Text annotations

Reader highlights, text colors, bold, italic, underline, and strikethrough are
saved with each text in the current browser and restored when the reading is
reopened. A control at the top of the reading clears all text annotations after
confirmation. Saved-word styling is a separate vocabulary overlay and is not
removed when annotations are cleared.

## Preferences

Settings includes browser-local preferences for light, dark, or system-matched
appearance; app language; and reader body-text size in pixels. Reader text
defaults to 14px. App language currently updates the document language for
accessibility; translated interface copy is not yet implemented.
