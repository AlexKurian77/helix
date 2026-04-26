"""
Literature QC — classifies retrieval results to assess prior work.
Returns a status: not_found, similar_work_exists, or exact_match.
"""
from models.schemas import LiteratureQC, LiteratureStatus, Reference


# Score thresholds for classification
EXACT_MATCH_THRESHOLD = 0.90
SIMILAR_THRESHOLD = 0.70


def perform_literature_qc(retrieved: list[dict]) -> LiteratureQC:
    """
    Analyze retrieval results and classify the literature landscape.

    Args:
        retrieved: List of dicts from retrieval service (must have 'score', 'title', etc.)

    Returns:
        LiteratureQC with status, message, and top references
    """
    if not retrieved:
        return LiteratureQC(
            status=LiteratureStatus.NOT_FOUND,
            message="No relevant protocols or research were found in the database. "
                    "This may be a novel research area or the query may need refinement.",
            references=[]
        )

    # Get the top score to determine classification
    top_score = max(r["score"] for r in retrieved)

    # Build reference list (top 3)
    references = []
    for r in retrieved[:3]:
        references.append(Reference(
            title=r["title"],
            domain=r.get("domain", "general"),
            relevance_score=round(r["score"], 3),
            type=r.get("type", "protocol"),
            snippet=r.get("text", "")[:200] + "..." if len(r.get("text", "")) > 200 else r.get("text", ""),
            url=r.get("url")
        ))

    # Classify based on top relevance score
    if top_score >= EXACT_MATCH_THRESHOLD:
        return LiteratureQC(
            status=LiteratureStatus.EXACT_MATCH,
            message=f"An exact or very close match was found (relevance: {top_score:.1%}). "
                    f"Existing protocols can be directly adapted for this experiment.",
            references=references,
        )
    elif top_score >= SIMILAR_THRESHOLD:
        return LiteratureQC(
            status=LiteratureStatus.SIMILAR_WORK_EXISTS,
            message=f"Similar work exists in the literature (best match: {top_score:.1%}). "
                    f"The experiment plan will build upon these related protocols.",
            references=references,
        )
    else:
        return LiteratureQC(
            status=LiteratureStatus.NOT_FOUND,
            message=f"No closely matching protocols found (best match: {top_score:.1%}). "
                    f"The plan will be generated from general scientific principles.",
            references=references,
        )
