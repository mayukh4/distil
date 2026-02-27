// Shared constants between popup and newtab
// This file is loaded by both popup.html and newtab.html

const ARXIV_CATEGORIES = {
    'Physics': {
        'astro-ph.GA': 'Galaxies',
        'astro-ph.HE': 'High Energy',
        'astro-ph.IM': 'Instrumentation',
        'astro-ph.CO': 'Cosmology',
        'astro-ph.EP': 'Earth & Planetary',
        'astro-ph.SR': 'Solar & Stellar',
        'gr-qc': 'General Relativity',
        'hep-ph': 'High Energy Physics',
        'hep-th': 'High Energy Theory',
        'quant-ph': 'Quantum Physics',
        'cond-mat.mes-hall': 'Mesoscale Physics',
        'cond-mat.mtrl-sci': 'Materials Science',
        'physics.optics': 'Optics',
        'physics.plasm-ph': 'Plasma Physics'
    },
    'Computer Science': {
        'cs.AI': 'AI',
        'cs.LG': 'Machine Learning',
        'cs.CL': 'Computation & Language',
        'cs.CV': 'Computer Vision',
        'cs.CR': 'Cryptography',
        'cs.DB': 'Databases',
        'cs.DC': 'Distributed Computing',
        'cs.DS': 'Data Structures',
        'cs.HC': 'Human-Computer Interaction',
        'cs.IR': 'Information Retrieval',
        'cs.NE': 'Neural & Evolutionary',
        'cs.PL': 'Programming Languages',
        'cs.RO': 'Robotics',
        'cs.SE': 'Software Engineering',
        'cs.SI': 'Social & Info Networks'
    },
    'Mathematics': {
        'math.AG': 'Algebraic Geometry',
        'math.AP': 'Analysis of PDEs',
        'math.CO': 'Combinatorics',
        'math.DG': 'Differential Geometry',
        'math.NA': 'Numerical Analysis',
        'math.OC': 'Optimization',
        'math.PR': 'Probability',
        'math.ST': 'Statistics Theory'
    },
    'Quantitative Biology': {
        'q-bio.BM': 'Biomolecules',
        'q-bio.GN': 'Genomics',
        'q-bio.MN': 'Molecular Networks',
        'q-bio.NC': 'Neurons & Cognition',
        'q-bio.PE': 'Populations & Evolution',
        'q-bio.QM': 'Quantitative Methods'
    },
    'Statistics': {
        'stat.ML': 'Machine Learning',
        'stat.ME': 'Methodology',
        'stat.AP': 'Applications',
        'stat.TH': 'Theory',
        'stat.CO': 'Computation'
    },
    'Economics': {
        'econ.EM': 'Econometrics',
        'econ.GN': 'General Economics',
        'econ.TH': 'Theoretical Economics'
    },
    'Electrical Engineering': {
        'eess.AS': 'Audio & Speech',
        'eess.IV': 'Image & Video',
        'eess.SP': 'Signal Processing',
        'eess.SY': 'Systems & Control'
    }
};

const GOOGLE_NEWS_TOPICS = {
    'TECHNOLOGY': 'Technology',
    'SCIENCE': 'Science',
    'BUSINESS': 'Business',
    'HEALTH': 'Health',
    'WORLD': 'World',
    'NATION': 'Nation',
    'ENTERTAINMENT': 'Entertainment',
    'SPORTS': 'Sports'
};

const DEFAULT_SETTINGS = {
    arxivCategories: ['cs.AI', 'cs.LG', 'cs.CL'],
    newsTopics: ['TECHNOLOGY', 'SCIENCE'],
    tempUnit: 'C',
    city: '',
    userName: '',
    weatherApiKey: '',
    quickLinks: [],
    apodEnabled: false,
    zenMode: false,
    firstRun: true,
    activeTab: 'papers'
};
