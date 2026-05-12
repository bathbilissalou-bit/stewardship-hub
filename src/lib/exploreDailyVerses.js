// Daily verse for Explore (one per weekday index 0–6). Fallback: English.
export const EXPLORE_VERSES = {
  en: [
    { ref: 'Proverbs 3:9', text: 'Honour the Lord with your wealth and with the firstfruits of all your produce.' },
    { ref: 'Luke 16:10', text: 'Whoever is faithful in very little is also faithful in much.' },
    { ref: 'Matthew 6:21', text: 'For where your treasure is, there your heart will be also.' },
    { ref: 'Proverbs 22:7', text: 'The borrower is servant to the lender.' },
    { ref: 'Deuteronomy 8:18', text: 'Remember the Lord your God, for it is he who gives you the ability to produce wealth.' },
    { ref: '1 Timothy 6:6', text: 'Godliness with contentment is great gain.' },
    { ref: 'Malachi 3:10', text: 'Bring the whole tithe into the storehouse, that there may be food in my house.' },
  ],
  fr: [
    { ref: 'Proverbes 3:9', text: 'Honore l’Éternel avec tes biens et avec les premiers fruits de tout ton revenu.' },
    { ref: 'Luc 16:10', text: 'Celui qui est fidèle en peu de chose l’est aussi en beaucoup.' },
    { ref: 'Matthieu 6:21', text: 'Car là où est ton trésor, là aussi sera ton cœur.' },
    { ref: 'Proverbes 22:7', text: 'L’emprunteur est esclave du prêteur.' },
    { ref: 'Deutéronome 8:18', text: 'Souviens-toi de l’Éternel ton Dieu, car c’est lui qui te donne la force de produire des richesses.' },
    { ref: '1 Timothée 6:6', text: 'La piété avec contentement est une grande richesse.' },
    { ref: 'Malachie 3:10', text: 'Apportez toute la dîme à la maison du trésor, afin qu’il y ait de la nourriture dans ma maison.' },
  ],
  es: [
    { ref: 'Proverbios 3:9', text: 'Honra a Jehová con tus bienes y con las primicias de todos tus frutos.' },
    { ref: 'Lucas 16:10', text: 'El que es fiel en lo muy pequeño, también es fiel en lo mucho.' },
    { ref: 'Mateo 6:21', text: 'Porque donde esté tu tesoro, allí estará también tu corazón.' },
    { ref: 'Proverbios 22:7', text: 'El rico se enseñorea de los pobres, y el que pide prestado es siervo del que presta.' },
    { ref: 'Deuteronomio 8:18', text: 'Acuérdate de Jehová tu Dios, porque él te da el poder para producir riquezas.' },
    { ref: '1 Timoteo 6:6', text: 'Y grande ganancia es la piedad acompañada de contentamiento.' },
    { ref: 'Malaquías 3:10', text: 'Traed todos los diezmos al almacén, para que haya alimento en mi casa.' },
  ],
  pt: [
    { ref: 'Provérbios 3:9', text: 'Honra ao Senhor com os teus bens e com as primícias de toda a tua renda.' },
    { ref: 'Lucas 16:10', text: 'Quem é fiel nas coisas pequenas também é fiel nas grandes.' },
    { ref: 'Mateus 6:21', text: 'Porque onde estiver o teu tesouro, aí estará também o teu coração.' },
    { ref: 'Provérbios 22:7', text: 'O rico domina sobre os pobres, e o que toma emprestado é servo do que empresta.' },
    { ref: 'Deuteronômio 8:18', text: 'Lembra-te do Senhor teu Deus, pois ele te dá força para adquirir riquezas.' },
    { ref: '1 Timóteo 6:6', text: 'Com efeito, a piedade com contentamento é grande ganância.' },
    { ref: 'Malaquias 3:10', text: 'Trazei todos os dízimos à casa do tesouro, para que haja mantimento na minha casa.' },
  ],
}

export function getExploreDailyVerse(lang) {
  const list = EXPLORE_VERSES[lang] || EXPLORE_VERSES.en
  return list[new Date().getDay() % list.length]
}
