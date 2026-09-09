'use client';

import { useEffect, useRef } from 'react';

const excerpts = [
  {
    language: 'de',
    title: 'Faust · Goethe',
    text: 'Habe nun, ach! Philosophie, Juristerei und Medizin, und leider auch Theologie durchaus studiert, mit heißem Bemühn.',
  },
  {
    language: 'es',
    title: 'Don Quijote · Cervantes',
    text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo.',
  },
  {
    language: 'it',
    title: 'La Divina Commedia · Dante',
    text: 'Nel mezzo del cammin di nostra vita mi ritrovai per una selva oscura, ché la diritta via era smarrita.',
  },
  {
    language: 'fr',
    title: 'Les Misérables · Hugo',
    text: 'En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C’était un vieillard d’environ soixante-quinze ans.',
  },
  {
    language: 'zh',
    title: '論語 · 孔子',
    text: '學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？',
  },
  {
    language: 'ja',
    title: '源氏物語 · 紫式部',
    text: 'いづれの御時にか、女御、更衣あまたさぶらひ給ひける中に、いとやむごとなき際にはあらぬが、すぐれて時めき給ふありけり。',
  },
  {
    language: 'ar',
    title: 'ألف ليلة وليلة',
    text: 'بلغني أيها الملك السعيد، ذو الرأي الرشيد، أن تاجراً من التجار كان كثير المال والمعاملات في البلاد.',
  },
  {
    language: 'en',
    title: 'Pride and Prejudice · Austen',
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
  },
  {
    language: 'grc',
    title: 'Ὀδύσσεια · Ὅμηρος',
    text: 'Ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον, ὃς μάλα πολλὰ πλάγχθη, ἐπεὶ Τροίης ἱερὸν πτολίεθρον ἔπερσε.',
  },
  {
    language: 'la',
    title: 'Aeneis · Vergilius',
    text: 'Arma virumque cano, Troiae qui primus ab oris Italiam, fato profugus, Laviniaque venit litora.',
  },
  {
    language: 'pt',
    title: 'Os Lusíadas · Camões',
    text: 'As armas e os barões assinalados, que da ocidental praia Lusitana, por mares nunca de antes navegados passaram ainda além da Taprobana.',
  },
  {
    language: 'ru',
    title: 'Евгений Онегин · Пушкин',
    text: 'Мой дядя самых честных правил, когда не в шутку занемог, он уважать себя заставил и лучше выдумать не мог.',
  },
  {
    language: 'fa',
    title: 'دیوان حافظ · حافظ',
    text: 'الا یا ایها الساقی ادر کأسا و ناولها، که عشق آسان نمود اول ولی افتاد مشکل‌ها.',
  },
  {
    language: 'hi',
    title: 'कबीर के दोहे · कबीर',
    text: 'बुरा जो देखन मैं चला, बुरा न मिलिया कोय। जो दिल खोजा आपना, मुझसे बुरा न कोय।',
  },
  {
    language: 'ko',
    title: '훈민정음 · 세종대왕',
    text: '나랏말싸미 듕귁에 달아 문자와로 서르 사맛디 아니할쎄, 이런 젼차로 어린 백셩이 니르고져 홀 배 이셔도.',
  },
  {
    language: 'tr',
    title: 'Yunus Emre Divanı · Yunus Emre',
    text: 'Ben gelmedim dava için, benim işim sevi için. Dostun evi gönüllerdir, gönüller yapmaya geldim.',
  },
  {
    language: 'pl',
    title: 'Pan Tadeusz · Mickiewicz',
    text: 'Litwo! Ojczyzno moja! ty jesteś jak zdrowie. Ile cię trzeba cenić, ten tylko się dowie, kto cię stracił.',
  },
  {
    language: 'he',
    title: 'תְּהִלִּים',
    text: 'אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים, וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד.',
  },
] as const;

function LiteratureColumn({ offset }: { offset: number }) {
  const ordered = [...excerpts.slice(offset), ...excerpts.slice(0, offset)];
  return (
    <div className="ambient-literature__copy">
      {[...ordered, ...ordered].map((excerpt, index) => (
        <section key={`${excerpt.language}-${index}`} lang={excerpt.language} dir="auto">
          <p className="ambient-literature__title">{excerpt.title}</p>
          <p>{excerpt.text}</p>
        </section>
      ))}
    </div>
  );
}

export function AmbientLiterature() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const activeLayer = layer;
    let frame = 0;

    function move(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        activeLayer.style.setProperty('--torch-x', `${event.clientX}px`);
        activeLayer.style.setProperty('--torch-y', `${event.clientY}px`);
        activeLayer.dataset.active = 'true';
      });
    }

    function hide() {
      activeLayer.dataset.active = 'false';
    }

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="ambient-literature" data-active="false">
      <div className="ambient-literature__page">
        {[0, 4, 8, 12, 16, 2].map((offset) => (
          <LiteratureColumn key={offset} offset={offset} />
        ))}
      </div>
    </div>
  );
}
