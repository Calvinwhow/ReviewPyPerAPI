# Review Pyper — Validation Datasets

This directory holds external benchmark datasets that Review Pyper can be
evaluated against. Nothing here is wired into the app yet — these are raw
materials for a future replication study.

## What's here

```
validation/
├── README.md            (this file)
├── build_inventory.py   (regenerates inventory.csv from clef-tar/)
├── inventory.csv        (one row per CLEF-TAR topic; 246 rows)
├── clef-tar/            (full clone of github.com/CLEF-TAR/tar — 1.5 GB)
└── cohen-2006/
    └── epc-ir.clean.tsv (15-topic gold standard, 18,733 rows)
```

`clef-tar/` is a shallow git clone — to update, run `git -C clef-tar pull`.

## Datasets

### 1. CLEF eHealth TAR (2017–2019)  ←  primary benchmark

Native Cochrane reviews with Boolean queries and PubMed-level inclusion
labels. Used by dozens of published AI screening tools (Sheffield, Waterloo
CAL, BERT rankers, etc.), so results are directly comparable.

| Year | Type           | Train | Test | Notes                                       |
|------|----------------|------:|-----:|---------------------------------------------|
| 2017 | DTA            |    21 |   30 | First release; DTA only                     |
| 2018 | DTA            |    42 |   30 | Re-uses + expands 2017 set                  |
| 2019 | DTA            |    72 |    8 | Train = 2017+2018 combined                  |
| 2019 | Intervention   |    20 |   20 | Added in 2019 — closer to typical Cochrane  |
| 2019 | Prognosis      |     - |    1 |                                             |
| 2019 | Qualitative    |     - |    2 |                                             |

Topic IDs overlap across years (e.g. CD008760 appears in 2017 test, 2018
train, and 2019 train). `inventory.csv` lists every (year × type × split)
entry; there are 129 unique Cochrane review IDs in total.

**File layout per year (Task 2 — title/abstract screening):**
- `topics/<CD-id>` — plain-text file with the topic ID, title, and the
  Cochrane Boolean query (MEDLINE syntax).
- `qrels/*.qrels` — TREC-format relevance judgments:
  `<topic-id> 0 <pmid> <0|1>` — one row per PMID returned by the query;
  `1` = included in the review.

For each topic, full PubMed records (titles + abstracts) live under
`extracted_data/` (2017) or `pids/` (2018+) — these are what your screener
actually reads.

### 2. Cohen 2006 — DERP/AHRQ drug-class reviews

Not Cochrane, but the most-cited benchmark in the field. 15 systematic
reviews of drug-class effectiveness, each with abstract- and article-level
inclusion decisions. Classic point of comparison even though it predates
modern AI tools.

`epc-ir.clean.tsv` columns: `topic`, `EndNoteID`, `PMID`, `abstract_status`,
`article_status` (`I` = include, `E` = exclude). Topics:

```
ACEInhibitors        Antihistamines           BetaBlockers
ADHD                 AtypicalAntipsychotics   CalciumChannelBlockers
Estrogens            NSAIDS                   Opioids
OralHypoglycemics    ProtonPumpInhibitors     SkeletalMuscleRelaxants
Statins              Triptans                 UrinaryIncontinence
```

The corresponding MEDLINE records are in the TREC Genomics Track 10-year
corpus (NIST). Not bundled here — fetch separately if/when needed.

## Recommended starter topics

Smallest CLEF-TAR Cochrane reviews (good for first pipeline runs — small
enough to hand-inspect, all required files already on disk):

| Topic ID  | Records | Included | Type         | Title                                                     |
|-----------|--------:|---------:|--------------|-----------------------------------------------------------|
| CD010355  |      86 |       15 | Intervention | Non-invasive positive pressure ventilation post-pulm. resection |
| CD012164  |     110 |        9 | Intervention | Subfascial endoscopic perforator surgery for venous ulcers |
| CD008760  |     128 |       21 | DTA          | Capsule endoscopy for oesophageal varices                  |
| CD011380  |     132 |       12 | Intervention | Interventions for infantile seborrhoeic dermatitis         |
| CD010705  |     228 |       41 | DTA          | GenoType MTBDRsl for second-line drug-resistant TB         |

(Run `python build_inventory.py` then sort `inventory.csv` by `n_records`
to find more.)

## What this directory is NOT

- Not yet integrated with the Review Pyper API or frontend.
- No screening runs, no evaluation scripts, no reports.
- No fetched PubMed abstracts beyond what CLEF-TAR ships with.

Replication, abstract retrieval, and metric calculation (WSS@95, recall,
last-relevant-found, etc.) come in a follow-up step.

## Sources

- CLEF-TAR data: https://github.com/CLEF-TAR/tar
- Cohen 2006 data page: https://dmice.ohsu.edu/cohenaa/systematic-drug-class-review-data.html
- Original Cohen et al. 2006 paper: https://doi.org/10.1197/jamia.M1929
- CLEF 2017 overview: https://ceur-ws.org/Vol-1866/invited_paper_12.pdf
- CLEF 2018 overview: https://ceur-ws.org/Vol-2125/invited_paper_6.pdf
- CLEF 2019 overview: https://pure.uva.nl/ws/files/43246689/Kelly2019_Chapter_OverviewOfTheCLEFEHealthEvalua.pdf
