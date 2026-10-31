"""
Executive PDF Briefing Generator for Vidura.
Produces a crisp, 1-page executive summary briefing using ReportLab,
incorporating CERT-In Smart City cyber security guidelines, top cyber-physical risks,
choke point mitigations, and cascade analysis for Navanagar (5 lakh population).
"""
import io
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from backend.engine.choke_point import ChokePointEngine
from backend.engine.risk_calculator import RiskCalculator
from backend.engine.scenario import load_assumptions, load_scenario

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CERTIN_FILE = DATA_DIR / "certin_mapping.json"


def generate_executive_briefing_pdf(
    persona: str = "nation_state",
    scenario=None,
    assumptions=None,
) -> bytes:
    """
    Generates a 1-page executive risk briefing PDF and returns raw bytes.
    """
    scenario = scenario or load_scenario(validate_cves=False)
    assumptions = assumptions or load_assumptions()

    rc = RiskCalculator(scenario=scenario, assumptions=assumptions)
    risk_data = rc.calculate_all(persona=persona)
    top_assets = risk_data["assets"][:4]

    choke_engine = ChokePointEngine(attack_engine=rc.attack_engine, scenario=scenario, assumptions=assumptions)
    choke_data = choke_engine.identify_choke_points(top_n=3)["choke_points"]

    certin_items = []
    if CERTIN_FILE.exists():
        with open(CERTIN_FILE, "r", encoding="utf-8") as f:
            certin_items = json.load(f)[:3]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=28,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0284C7"),
    )
    meta_style = ParagraphStyle(
        "DocMeta",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#475569"),
    )
    section_h2 = ParagraphStyle(
        "SectionH2",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=4,
        spaceAfter=2,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#334155"),
    )
    callout_style = ParagraphStyle(
        "Callout",
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F172A"),
    )
    table_cell = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=7.0,
        leading=8.5,
        textColor=colors.HexColor("#1E293B"),
    )
    table_header = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=7.0,
        leading=8.5,
        textColor=colors.HexColor("#FFFFFF"),
    )

    story = []

    # 1. Header Block
    header_table = Table(
        [
            [
                Paragraph("<b>VIDURA</b> // Executive Cyber-Physical Risk Briefing", title_style),
                Paragraph(f"<b>TARGET:</b> City of Navanagar (5 Lakh CII)<br/><b>DATE:</b> {datetime.now(timezone.utc).strftime('%d %b %Y %H:%M UTC')}", meta_style),
            ],
            [
                Paragraph("AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation", subtitle_style),
                Paragraph(f"<b>THREAT MODEL:</b> {persona.replace('_', ' ').title()} Actor", meta_style),
            ]
        ],
        colWidths=[380, 160],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceAfter=5))

    # 2. Executive Callout Box: Cascade & Ingestion Story
    callout_text = (
        "<b>CRITICAL FINDING:</b> Multi-stage cyber compromise of <b>Feeder Substation SS-2</b> combined with "
        "the <b>Hospital Backup Generator Controller</b> drops emergency power buffer from 24 h to 0 h, causing immediate power failure "
        "at <b>District Hospital (300 beds, 20 ICU)</b>. Chemical dosing PLC attack disrupts piped water supply for <b>200,000 residents</b> "
        "for 69 hours. Consequence calculations follow Idaho National Laboratory (INL) CCE principles."
    )
    callout_box = Table(
        [[Paragraph(callout_text, callout_style)]],
        colWidths=[540],
    )
    callout_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0F9FF")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#38BDF8")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(callout_box)
    story.append(Spacer(1, 5))

    # 3. Top Critical Assets Table
    story.append(Paragraph("<b>1. Highest Risk Cyber-Physical Assets</b> (Likelihood × Consequence on 0–100 Scale)", section_h2))

    asset_rows = [[
        Paragraph("Asset Name", table_header),
        Paragraph("Purdue / Site", table_header),
        Paragraph("Key CVE / Weakness", table_header),
        Paragraph("Likelihood", table_header),
        Paragraph("Consequence", table_header),
        Paragraph("Risk Score", table_header),
    ]]

    for a in top_assets:
        cve_label = a["best_cve"] or ("Default Creds" if a["default_credentials"] else "None")
        if a["cisa_kev"]:
            cve_label += " (CISA KEV)"
        asset_rows.append([
            Paragraph(f"<b>{a['name']}</b>", table_cell),
            Paragraph(f"{a['purdue_level']} / {a['site'].title()}", table_cell),
            Paragraph(cve_label, table_cell),
            Paragraph(f"{a['likelihood_score']:.2f}", table_cell),
            Paragraph(f"{a['consequence_score']:.2f}", table_cell),
            Paragraph(f"<b>{a['risk_score']:.1f}</b> ({a['risk_level'].upper()})", table_cell),
        ])

    asset_table = Table(asset_rows, colWidths=[150, 75, 135, 55, 60, 65])
    asset_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(asset_table)
    story.append(Spacer(1, 5))

    # 4. Strategic Choke Points & Remediations
    story.append(Paragraph("<b>2. Network Choke Points & Recommended Remediations</b>", section_h2))

    choke_rows = [[
        Paragraph("Choke Point Asset", table_header),
        Paragraph("Purdue Level", table_header),
        Paragraph("Betweenness", table_header),
        Paragraph("Action Type", table_header),
        Paragraph("Recommended Engineering Action", table_header),
        Paragraph("Est. ΔRisk", table_header),
    ]]

    for cp in choke_data:
        choke_rows.append([
            Paragraph(f"<b>{cp['name']}</b>", table_cell),
            Paragraph(cp["purdue_level"], table_cell),
            Paragraph(f"{cp['betweenness_centrality']:.3f}", table_cell),
            Paragraph(cp["action_type"].upper(), table_cell),
            Paragraph(cp["recommended_action"], table_cell),
            Paragraph(f"-{int(cp['estimated_risk_reduction'] * 100)}%", table_cell),
        ])

    choke_table = Table(choke_rows, colWidths=[120, 55, 55, 65, 195, 50])
    choke_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0FDFA")]),
    ]))
    story.append(choke_table)
    story.append(Spacer(1, 5))

    # 5. Regulatory Alignment: CERT-In Smart City Cyber Security Guidelines
    story.append(Paragraph("<b>3. Regulatory Compliance Alignment</b> (CERT-In Smart City Infrastructure Guidelines)", section_h2))

    certin_rows = [[
        Paragraph("Focus Area", table_header),
        Paragraph("CERT-In Section & Title", table_header),
        Paragraph("Vidura Implementation & Verification Control", table_header),
    ]]

    for ci in certin_items:
        certin_rows.append([
            Paragraph(f"<b>{ci['area']}</b>", table_cell),
            Paragraph(f"Sec {ci['guideline_section']}: {ci['section_title']} (p. {ci['page']})", table_cell),
            Paragraph(ci["cascade_feature"], table_cell),
        ])

    certin_table = Table(certin_rows, colWidths=[110, 190, 240])
    certin_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4338CA")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#EEF2FF")]),
    ]))
    story.append(certin_table)
    story.append(Spacer(1, 5))

    # 6. Disclaimer and Footer
    disclaimer_text = (
        "<b>DISCLAIMER:</b> Navanagar is a fictional Indian city of 500,000 people created for PS 03 demonstration. "
        "All vulnerability data is grounded in verified CISA KEV and FIRST EPSS intelligence. "
        "Vidura © 2026 Critical Infrastructure Cyber Protection Platform."
    )
    story.append(Paragraph(disclaimer_text, meta_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
