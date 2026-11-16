// viphola.com 대문 — 두 문(인바운드 서울 · 아웃바운드 스페인어권) 문구
//  · 언어 4개: 한국어 · English · 日本語 · Español (11-15 사장님)
//  · 문구 언어: 주소 ?lang= → 사용자가 선택한 언어(저장값) → 영어(기본값, 11-15)
//  · 아웃바운드 문 글자는 대문 언어와 상관없이 늘 한국어(HTML 에 바로 적음, 여기 없음)
//  · 문 순서: 브라우저 언어가 한국어면 아웃바운드 문이 앞(왼쪽), 그 밖이면 인바운드 문이 앞
//  · 인바운드 문을 누르면 서울 페이지가 지금 대문 언어로 열림(seoul/?lang=…)
window.PAGE = 'gate';
window.DEFAULT_LANG = 'en';   // 11-15 사장님 「기본값을 영어로」 — 브라우저 언어와 상관없이 처음엔 영어, 언어 칸으로 변경
window.I18N = {
  en: {
    'meta.title': 'VIPHola.com — Private journeys',
    'meta.desc': 'Private travel, arranged with care — into Korea, and out to the Spanish-speaking world.',
    'lang.label': 'Language',
    'photo': 'Photo © Korea Tourism Organization',
    'g.title': 'Choose your journey',
    'g.lead': 'Private travel, arranged with care — into Korea, and out to the Spanish-speaking world.',
    'in.label': 'Inbound · Seoul',
    'in.title': 'Seoul, privately curated.',
    'in.sub': 'Four private days in Seoul for guests visiting Korea.',
    'in.cta': 'Enter',
    'foot.company': 'Booman Inc.', 'foot.contact': 'Enquiries', 'foot.terms': 'Terms & refund policy'
  },
  ko: {
    'meta.title': 'VIPHola.com — 프라이빗 여정',
    'meta.desc': '세심하게 준비하는 프라이빗 여행. 한국으로 오는 여정, 그리고 스페인어권으로 떠나는 여정.',
    'lang.label': '언어',
    'photo': '사진 © 한국관광공사',
    'g.title': '여정을 선택하세요',
    'g.lead': '세심하게 준비하는 프라이빗 여행. 한국으로 오는 여정, 그리고 스페인어권으로 떠나는 여정.',
    'in.label': '인바운드 · 서울',
    'in.title': '두 분만을 위해 설계한 서울',
    'in.sub': '한국을 찾는 해외 고객을 위한 서울 프라이빗 4일',
    'in.cta': '입장',
    'foot.company': '주식회사 부만', 'foot.contact': '문의', 'foot.terms': '약관·환불 규정'
  },
  ja: {
    'meta.title': 'VIPHola.com — プライベートな旅',
    'meta.desc': '心を込めて手配するプライベートな旅。韓国への旅、そしてスペイン語圏への旅。',
    'lang.label': '言語',
    'photo': '写真 © 韓国観光公社',
    'g.title': '旅をお選びください',
    'g.lead': '心を込めて手配するプライベートな旅。韓国への旅、そしてスペイン語圏への旅。',
    'in.label': 'インバウンド・ソウル',
    'in.title': 'おふたりのためだけの、ソウル。',
    'in.sub': '韓国を訪れるお客様のための、ソウルでのプライベートな4日間。',
    'in.cta': '詳しく見る',
    'foot.company': 'Booman Inc.', 'foot.contact': 'お問い合わせ', 'foot.terms': '約款・返金規定'
  },
  es: {
    'meta.title': 'VIPHola.com — Viajes privados',
    'meta.desc': 'Viajes privados organizados con esmero: a Corea y, desde Corea, al mundo hispanohablante.',
    'lang.label': 'Idioma',
    'photo': 'Foto © Organización de Turismo de Corea',
    'g.title': 'Elija su viaje',
    'g.lead': 'Viajes privados organizados con esmero: a Corea y, desde Corea, al mundo hispanohablante.',
    'in.label': 'Viajes a Corea · Seúl',
    'in.title': 'Seúl, solo para ustedes.',
    'in.sub': 'Cuatro días privados en Seúl para quienes visitan Corea.',
    'in.cta': 'Entrar',
    'foot.company': 'Booman Inc.', 'foot.contact': 'Consultas', 'foot.terms': 'Condiciones y reembolsos'
  }
};
