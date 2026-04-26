"""
Retrieval service — queries Pinecone, OpenAlex, AND Protocols.io.
Returns ranked results with metadata for Literature QC and context injection.
"""
from pinecone import Pinecone
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, TOP_K, DEMO_MODE
from services.embeddings import get_embedding
from services.openalex import search_papers
from services.protocols_io import search_protocols

_index = None


def _get_index():
    global _index
    if _index is None:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        _index = pc.Index(PINECONE_INDEX_NAME)
    return _index


def retrieve_context(query: str, top_k: int = TOP_K) -> list[dict]:
    """
    Retrieve relevant context from Pinecone (protocols), OpenAlex (papers),
    AND Protocols.io (live lab protocols).
    Returns list of dicts: { id, score, title, type, domain, text, url }
    """
    if DEMO_MODE:
        return _get_demo_results(query)

    retrieved = []

    # 1. Get Protocols from Pinecone
    try:
        query_embedding = get_embedding(query)
        index = _get_index()
        results = index.query(
            vector=query_embedding,
            top_k=top_k // 3 + 1,
            include_metadata=True
        )
        
        for match in results.matches:
            retrieved.append({
                "id": match.id,
                "score": float(match.score),
                "title": match.metadata.get("title", "Unknown"),
                "type": match.metadata.get("type", "protocol"),
                "domain": match.metadata.get("domain", "general"),
                "text": match.metadata.get("text", ""),
                "url": match.metadata.get("url", None)
            })
    except Exception as e:
        print(f"[Retrieval] Pinecone error: {e}")

    # 2. Get Live Papers from OpenAlex
    papers = search_papers(query, limit=top_k // 3 + 1)
    
    if papers:
        max_oa_score = max((p["score"] for p in papers), default=1.0)
        if max_oa_score <= 0:
            max_oa_score = 1.0
            
        for p in papers:
            normalized_score = 0.95 * (p["score"] / max_oa_score)
            retrieved.append({
                "id": p["id"],
                "score": round(normalized_score, 3),
                "title": p["title"],
                "type": "paper",
                "domain": p["domain"],
                "text": p["abstract"],
                "url": p["url"]
            })

    # 3. Get Live Lab Protocols from Protocols.io
    try:
        pio_protocols = search_protocols(query, limit=top_k // 3 + 1)
        retrieved.extend(pio_protocols)
        if pio_protocols:
            print(f"[Retrieval] Protocols.io returned {len(pio_protocols)} results")
    except Exception as e:
        print(f"[Retrieval] Protocols.io error: {e}")

    # 4. Search Past Lab Experiments (STATE grounding)
    try:
        from services.database_service import search_past_experiments
        past_exps = search_past_experiments(query, limit=top_k // 3 + 1)
        retrieved.extend(past_exps)
        if past_exps:
            print(f"[Retrieval] Local database returned {len(past_exps)} past experiments")
    except Exception as e:
        print(f"[Retrieval] Database search error: {e}")

    # Sort combined results by score and return top K
    retrieved.sort(key=lambda x: x["score"], reverse=True)
    return retrieved[:top_k]


# ---------------------------------------------------------------------------
# Demo data — realistic protocols and research summaries
# ---------------------------------------------------------------------------
DEMO_PROTOCOLS = [
    {
        "id": "proto-001",
        "title": "Western Blot Protocol for Protein Detection",
        "type": "protocol",
        "domain": "molecular biology",
        "text": (
            "Western blotting detects specific proteins in a sample. Steps: "
            "1) Lyse cells with RIPA buffer + protease inhibitors on ice for 30 min. "
            "2) Quantify protein via BCA assay. "
            "3) Load 20-50 µg protein per lane on 10-12% SDS-PAGE gel. "
            "4) Run electrophoresis at 100V for 1.5 h. "
            "5) Transfer to PVDF membrane at 100V for 1 h in cold transfer buffer. "
            "6) Block membrane with 5% non-fat milk in TBST for 1 h at RT. "
            "7) Incubate with primary antibody (1:1000) overnight at 4°C. "
            "8) Wash 3×10 min with TBST. "
            "9) Incubate with HRP-conjugated secondary antibody (1:5000) for 1 h at RT. "
            "10) Detect using ECL substrate and image."
        ),
    },
    {
        "id": "proto-002",
        "title": "CRISPR-Cas9 Gene Knockout in Mammalian Cells",
        "type": "protocol",
        "domain": "molecular biology",
        "text": (
            "CRISPR-Cas9 enables targeted gene disruption. Steps: "
            "1) Design sgRNA targeting exon of interest using CRISPOR or Benchling. "
            "2) Clone sgRNA into pSpCas9(BB)-2A-Puro (PX459) vector. "
            "3) Culture HEK293T cells to 70-80% confluence. "
            "4) Transfect using Lipofectamine 3000 (2 µg plasmid per well, 6-well plate). "
            "5) Select with puromycin (2 µg/mL) for 48-72 h. "
            "6) Expand single-cell clones by limiting dilution. "
            "7) Screen clones via T7 Endonuclease I assay or Sanger sequencing. "
            "8) Validate knockout by Western blot for target protein."
        ),
    },
    {
        "id": "proto-003",
        "title": "qRT-PCR Gene Expression Analysis",
        "type": "protocol",
        "domain": "molecular biology",
        "text": (
            "Quantitative RT-PCR measures mRNA expression levels. Steps: "
            "1) Extract total RNA using TRIzol reagent. "
            "2) Assess RNA quality (A260/280 ratio 1.8-2.0) via NanoDrop. "
            "3) Reverse-transcribe 1 µg RNA using SuperScript IV and oligo(dT) primers. "
            "4) Prepare qPCR reactions: 10 µL SYBR Green Master Mix, 1 µL each primer (10 µM), "
            "2 µL cDNA template, 6 µL nuclease-free water. "
            "5) Run: 95°C 10 min, then 40 cycles of 95°C 15 s / 60°C 1 min. "
            "6) Include no-template controls and reference gene (GAPDH or β-actin). "
            "7) Analyze using ΔΔCt method."
        ),
    },
    {
        "id": "proto-004",
        "title": "Bacterial Transformation via Heat Shock",
        "type": "protocol",
        "domain": "microbiology",
        "text": (
            "Heat shock transformation introduces plasmid DNA into competent E. coli. Steps: "
            "1) Thaw DH5α competent cells on ice for 10 min. "
            "2) Add 1-5 µL plasmid DNA (10-100 ng) to 50 µL cells, mix gently. "
            "3) Incubate on ice for 30 min. "
            "4) Heat shock at 42°C for exactly 45 seconds. "
            "5) Return to ice for 2 min. "
            "6) Add 450 µL pre-warmed SOC medium. "
            "7) Incubate at 37°C with shaking (225 rpm) for 1 h. "
            "8) Plate 50-200 µL on LB agar + appropriate antibiotic. "
            "9) Incubate plates at 37°C overnight."
        ),
    },
    {
        "id": "proto-005",
        "title": "MTT Cell Viability Assay",
        "type": "protocol",
        "domain": "cell biology",
        "text": (
            "MTT assay measures cell metabolic activity as a proxy for viability. Steps: "
            "1) Seed cells at 5,000-10,000 cells/well in 96-well plate. "
            "2) Allow to adhere overnight. "
            "3) Apply treatments in triplicate for desired duration. "
            "4) Add 20 µL MTT solution (5 mg/mL in PBS) to each well. "
            "5) Incubate at 37°C for 3-4 h. "
            "6) Remove media carefully. "
            "7) Dissolve formazan crystals with 150 µL DMSO per well. "
            "8) Shake plate for 15 min. "
            "9) Read absorbance at 570 nm (reference 690 nm) on plate reader."
        ),
    },
    {
        "id": "proto-006",
        "title": "Immunofluorescence Staining of Fixed Cells",
        "type": "protocol",
        "domain": "cell biology",
        "text": (
            "Immunofluorescence visualizes protein localization in cells. Steps: "
            "1) Grow cells on glass coverslips to 60-70% confluence. "
            "2) Fix with 4% paraformaldehyde in PBS for 15 min at RT. "
            "3) Permeabilize with 0.1% Triton X-100 in PBS for 10 min. "
            "4) Block with 3% BSA in PBS for 1 h at RT. "
            "5) Incubate with primary antibody (diluted in blocking buffer) overnight at 4°C. "
            "6) Wash 3×5 min with PBS. "
            "7) Incubate with fluorescent secondary antibody (1:500) for 1 h at RT in dark. "
            "8) Counterstain nuclei with DAPI (1 µg/mL) for 5 min. "
            "9) Mount with anti-fade mounting medium. "
            "10) Image on fluorescence or confocal microscope."
        ),
    },
    {
        "id": "proto-007",
        "title": "ELISA (Enzyme-Linked Immunosorbent Assay)",
        "type": "protocol",
        "domain": "immunology",
        "text": (
            "Sandwich ELISA quantifies a specific antigen in solution. Steps: "
            "1) Coat 96-well plate with capture antibody (1-10 µg/mL in carbonate buffer) overnight at 4°C. "
            "2) Wash 3× with PBST. Block with 1% BSA for 2 h at RT. "
            "3) Add standards and samples in duplicate, incubate 2 h at RT. "
            "4) Wash 4× with PBST. "
            "5) Add biotinylated detection antibody for 1 h at RT. "
            "6) Wash 4×. Add Streptavidin-HRP for 30 min. "
            "7) Wash 5×. Add TMB substrate and develop for 15-30 min. "
            "8) Stop with 2N H2SO4. "
            "9) Read at 450 nm. Generate standard curve and calculate concentrations."
        ),
    },
    {
        "id": "proto-008",
        "title": "Flow Cytometry and Cell Sorting (FACS)",
        "type": "protocol",
        "domain": "cell biology",
        "text": (
            "Flow cytometry analyzes and sorts cells by surface/intracellular markers. Steps: "
            "1) Harvest cells and count (need ≥1×10⁶ cells per condition). "
            "2) Wash with FACS buffer (PBS + 2% FBS + 0.1% NaN3). "
            "3) Block Fc receptors with anti-CD16/32 for 10 min on ice. "
            "4) Stain with fluorochrome-conjugated antibodies for 30 min on ice in dark. "
            "5) Wash 2× with FACS buffer. "
            "6) For intracellular staining: fix with Cytofix, permeabilize with Perm/Wash. "
            "7) Resuspend in 300 µL FACS buffer, filter through 40 µm strainer. "
            "8) Acquire on flow cytometer, gating on FSC/SSC to exclude debris. "
            "9) Analyze with FlowJo or FCS Express."
        ),
    },
    {
        "id": "paper-001",
        "title": "CRISPR-Based Approaches for Cancer Tumor Suppressor Gene Studies",
        "type": "paper",
        "domain": "molecular biology",
        "text": (
            "Recent advances in CRISPR-Cas9 technology have enabled systematic functional studies "
            "of tumor suppressor genes in cancer cell lines. Key findings: (i) Knockout screens in "
            "organoid models revealed novel synthetic lethal interactions with TP53 and RB1 loss. "
            "(ii) Base editing allows precise introduction of clinically observed point mutations "
            "without double-strand breaks. (iii) CRISPRi/CRISPRa enable reversible modulation of "
            "gene expression for temporal studies. Applications include identifying drug targets, "
            "understanding resistance mechanisms, and validating biomarkers."
        ),
    },
    {
        "id": "paper-002",
        "title": "Antibiotic Resistance Mechanisms in Gram-Negative Bacteria",
        "type": "paper",
        "domain": "microbiology",
        "text": (
            "This review summarizes current understanding of antibiotic resistance in E. coli and "
            "related species. Major mechanisms include: (i) β-lactamase enzymes (CTX-M, TEM, SHV families) "
            "hydrolyzing β-lactam antibiotics, (ii) efflux pump overexpression (AcrAB-TolC system), "
            "(iii) porin mutations reducing drug uptake, (iv) target site modifications via methyltransferases. "
            "Horizontal gene transfer via plasmids and transposons drives rapid spread. "
            "Combination therapy and novel antimicrobial peptides show promise against multi-drug resistant strains."
        ),
    },
    {
        "id": "paper-003",
        "title": "Novel Protein Biomarkers for Early-Stage Cancer Detection",
        "type": "paper",
        "domain": "biochemistry",
        "text": (
            "Proteomic analysis of serum samples from early-stage cancer patients identified several "
            "promising biomarker candidates. Using mass spectrometry-based proteomics and machine learning, "
            "a panel of 5 proteins (CA-125, HE4, CEA, AFP, and a novel marker LYPD3) achieved 94% sensitivity "
            "and 89% specificity for detecting stage I/II cancers. Validation in a cohort of 2,000 patients "
            "confirmed the panel outperforms single-marker approaches. ELISA-based clinical assays are in "
            "development for point-of-care deployment."
        ),
    },
    {
        "id": "proto-009",
        "title": "SDS-PAGE Gel Electrophoresis",
        "type": "protocol",
        "domain": "biochemistry",
        "text": (
            "SDS-PAGE separates proteins by molecular weight. Steps: "
            "1) Prepare resolving gel (10-12% acrylamide) and stacking gel (4%). "
            "2) Add sample buffer (with SDS and β-mercaptoethanol) to protein samples. "
            "3) Denature at 95°C for 5 min. "
            "4) Load 10-30 µL per well alongside molecular weight marker. "
            "5) Run at 80V through stacking gel, then 120V through resolving gel. "
            "6) Stain with Coomassie Blue R-250 for 1 h or use silver stain for higher sensitivity. "
            "7) Destain with methanol:acetic acid:water (40:10:50) until bands are visible."
        ),
    },
]


def _get_demo_results(query: str) -> list[dict]:
    """
    Match demo protocols to the query using keyword relevance.
    Returns top results with simulated relevance scores.
    """
    query_lower = query.lower()

    # Keyword to protocol index mapping
    keyword_map = {
        "protein": ["proto-001", "proto-009", "paper-003"],
        "western": ["proto-001", "proto-009"],
        "blot": ["proto-001", "proto-009"],
        "crispr": ["proto-002", "paper-001"],
        "gene": ["proto-002", "proto-003", "paper-001"],
        "knockout": ["proto-002", "paper-001"],
        "pcr": ["proto-003"],
        "expression": ["proto-003", "proto-006"],
        "rna": ["proto-003"],
        "bacteria": ["proto-004", "paper-002"],
        "transform": ["proto-004"],
        "e. coli": ["proto-004", "paper-002"],
        "viability": ["proto-005"],
        "cell": ["proto-005", "proto-006", "proto-008"],
        "mtt": ["proto-005"],
        "fluorescence": ["proto-006"],
        "microscop": ["proto-006"],
        "immunofluorescence": ["proto-006"],
        "elisa": ["proto-007", "paper-003"],
        "antibod": ["proto-007", "proto-001"],
        "cancer": ["paper-001", "paper-003", "proto-005"],
        "tumor": ["paper-001", "paper-003"],
        "antibiotic": ["paper-002"],
        "resistance": ["paper-002"],
        "biomarker": ["paper-003", "proto-007"],
        "flow cytometry": ["proto-008"],
        "facs": ["proto-008"],
        "sorting": ["proto-008"],
        "drug": ["proto-005", "paper-002"],
    }

    # Score each protocol based on keyword matches
    scores: dict[str, float] = {}
    for keyword, proto_ids in keyword_map.items():
        if keyword in query_lower:
            for pid in proto_ids:
                scores[pid] = scores.get(pid, 0.5) + 0.12

    # Cap scores at 0.95
    for pid in scores:
        scores[pid] = min(scores[pid], 0.95)

    # Build results from scored protocols
    proto_lookup = {p["id"]: p for p in DEMO_PROTOCOLS}
    results = []
    for pid, score in sorted(scores.items(), key=lambda x: -x[1]):
        p = proto_lookup[pid]
        results.append({**p, "score": round(score, 3)})

    # If no keyword matches, return first 3 protocols with lower scores
    if not results:
        for i, p in enumerate(DEMO_PROTOCOLS[:3]):
            results.append({**p, "score": round(0.55 - i * 0.05, 3)})

    return results[:5]
