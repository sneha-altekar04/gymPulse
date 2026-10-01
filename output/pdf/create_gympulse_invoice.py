from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "GymPulse_Client_Invoice.pdf"

NAVY = colors.HexColor("#071A2D")
BLUE = colors.HexColor("#0C8CE9")
ORANGE = colors.HexColor("#FF7A21")
PALE_BLUE = colors.HexColor("#EAF5FD")
PALE_ORANGE = colors.HexColor("#FFF1E8")
INK = colors.HexColor("#142033")
MUTED = colors.HexColor("#5E6B7C")
LINE = colors.HexColor("#D8E1EB")
WHITE = colors.white


def register_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("InvoiceArial", str(regular)))
        pdfmetrics.registerFont(TTFont("InvoiceArialBold", str(bold)))
        return "InvoiceArial", "InvoiceArialBold"
    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def money(value):
    sign = "-" if value < 0 else ""
    return f"{sign}Rs. {abs(value):,.2f}"


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Brand",
    fontName=BOLD,
    fontSize=22,
    leading=25,
    textColor=WHITE,
    spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="BrandSub",
    fontName=REGULAR,
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#BBDCF5"),
))
styles.add(ParagraphStyle(
    name="InvoiceTitle",
    fontName=BOLD,
    fontSize=24,
    leading=27,
    textColor=WHITE,
    alignment=TA_RIGHT,
))
styles.add(ParagraphStyle(
    name="SmallWhiteRight",
    fontName=REGULAR,
    fontSize=8.5,
    leading=11,
    textColor=WHITE,
    alignment=TA_RIGHT,
))
styles.add(ParagraphStyle(
    name="Section",
    fontName=BOLD,
    fontSize=9,
    leading=12,
    textColor=BLUE,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="Body",
    fontName=REGULAR,
    fontSize=9,
    leading=13,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="BodyMuted",
    fontName=REGULAR,
    fontSize=8,
    leading=11,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="TableHead",
    fontName=BOLD,
    fontSize=8,
    leading=10,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="TableCell",
    fontName=REGULAR,
    fontSize=8.2,
    leading=10.5,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="TableCellRight",
    fontName=REGULAR,
    fontSize=8.2,
    leading=10.5,
    textColor=INK,
    alignment=TA_RIGHT,
))
styles.add(ParagraphStyle(
    name="TableCellBold",
    fontName=BOLD,
    fontSize=8.5,
    leading=11,
    textColor=INK,
))
styles.add(ParagraphStyle(
    name="TableCellBoldRight",
    fontName=BOLD,
    fontSize=8.5,
    leading=11,
    textColor=INK,
    alignment=TA_RIGHT,
))
styles.add(ParagraphStyle(
    name="GrandLabel",
    fontName=BOLD,
    fontSize=11,
    leading=14,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="GrandValue",
    fontName=BOLD,
    fontSize=14,
    leading=16,
    textColor=WHITE,
    alignment=TA_RIGHT,
))
styles.add(ParagraphStyle(
    name="Footer",
    fontName=REGULAR,
    fontSize=7.5,
    leading=10,
    textColor=MUTED,
    alignment=TA_CENTER,
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
    canvas.setFont(REGULAR, 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(16 * mm, 8 * mm, "GymPulse - Custom Gym Management System")
    canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=16 * mm,
    leftMargin=16 * mm,
    topMargin=8 * mm,
    bottomMargin=17 * mm,
    title="GymPulse Client Invoice",
    author="GymPulse",
)

story = []

header_left = Table([
    [p("GYM<span color='#0C8CE9'>PULSE</span>", "Brand")],
    [p("CUSTOM GYM MANAGEMENT SYSTEM", "BrandSub")],
], colWidths=[102 * mm])
header_left.setStyle(TableStyle([
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))
header_right = Table([
    [p("INVOICE", "InvoiceTitle")],
    [p("Invoice No: GP-2026-001<br/>Date: 27 September 2026<br/>Currency: INR", "SmallWhiteRight")],
], colWidths=[59 * mm])
header_right.setStyle(TableStyle([
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))

header = Table(
    [[header_left, header_right]],
    colWidths=[112 * mm, 67 * mm],
)
header.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("BOX", (0, 0), (-1, -1), 0, NAVY),
    ("LEFTPADDING", (0, 0), (0, 0), 10 * mm),
    ("RIGHTPADDING", (1, 0), (1, 0), 8 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(header)
story.append(Spacer(1, 7 * mm))

party = Table([
    [p("FROM", "Section"), p("BILL TO", "Section")],
    [p("<b>[Your Name / Business Name]</b><br/>Software development and implementation services<br/>[Phone] | [Email]", "Body"),
     p("<b>Client / Gym Owner</b><br/>[Gym Name]<br/>[Address / Contact Details]", "Body")],
], colWidths=[89.5 * mm, 89.5 * mm])
party.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), PALE_BLUE),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
    ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 2 * mm),
    ("TOPPADDING", (0, 1), (-1, 1), 4 * mm),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 4 * mm),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(party)
story.append(Spacer(1, 6 * mm))

project = Table([
    [p("PROJECT", "Section"), p("GymPulse Custom Gym Management Web Application", "TableCellBold")],
    [p("SCOPE", "Section"), p("Design, development, configuration and deployment of the agreed gym operations platform.", "TableCell")],
], colWidths=[28 * mm, 151 * mm])
project.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), PALE_ORANGE),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 2.8 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8 * mm),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(project)
story.append(Spacer(1, 6 * mm))

features = [
    ("Public gym profile and responsive interface", "Customer-facing gym information page and responsive application layout.", 6000),
    ("Secure login, user roles and permissions", "Authentication and controlled access for owner, manager, reception and trainer roles.", 7000),
    ("Member and trainer management", "Member records, profiles, search, status tracking and trainer administration.", 10000),
    ("Membership plans, renewals and personal training", "Plan configuration, membership lifecycle, renewals and PT package management.", 10000),
    ("Attendance management", "Manual attendance, attendance history and operational tracking.", 7000),
    ("Payments and digital receipts", "Payment recording, collection information and receipt generation.", 8000),
    ("Dashboard and business reports", "Operational KPIs, charts, filters and management reporting.", 7000),
    ("Messaging, settings and production deployment", "Member communication tools, system configuration and initial deployment support.", 5000),
]

rows = [[p("FEATURE / MODULE", "TableHead"), p("DELIVERABLE", "TableHead"), p("VALUE", "TableHead")]]
for name, description, amount in features:
    rows.append([p(name, "TableCellBold"), p(description, "TableCell"), p(money(amount), "TableCellRight")])

feature_table = Table(rows, colWidths=[55 * mm, 96 * mm, 28 * mm], repeatRows=1)
feature_style = [
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
    ("TOPPADDING", (0, 0), (-1, 0), 3 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 3 * mm),
    ("TOPPADDING", (0, 1), (-1, -1), 2.3 * mm),
    ("BOTTOMPADDING", (0, 1), (-1, -1), 2.3 * mm),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
]
for row_index in range(1, len(rows)):
    if row_index % 2 == 0:
        feature_style.append(("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#F7FAFD")))
feature_table.setStyle(TableStyle(feature_style))
story.append(feature_table)
story.append(Spacer(1, 5 * mm))

summary_rows = [
    [p("Normal development value", "TableCellBold"), p(money(60000), "TableCellBoldRight")],
    [p("Introductory project discount", "TableCell"), p(money(-25000), "TableCellRight")],
    [p("Discounted development price", "TableCellBold"), p(money(35000), "TableCellBoldRight")],
    [p("GoDaddy domain cost", "TableCell"), p(money(4243), "TableCellRight")],
]
summary = Table(summary_rows, colWidths=[67 * mm, 34 * mm], hAlign="RIGHT")
summary.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
    ("BACKGROUND", (0, 1), (-1, 1), PALE_ORANGE),
    ("BACKGROUND", (0, 2), (-1, 2), PALE_BLUE),
    ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(summary)

grand = Table([[p("GRAND TOTAL", "GrandLabel"), p(money(39243), "GrandValue")]], colWidths=[67 * mm, 34 * mm], hAlign="RIGHT")
grand.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), BLUE),
    ("BOX", (0, 0), (-1, -1), 0, BLUE),
    ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 3.2 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2 * mm),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(grand)
story.append(Spacer(1, 3 * mm))
story.append(p(
    "<b>Maintenance option:</b> Rs. 15,000 per year for routine bug fixes, updates and basic support. "
    "New features, hosting, Firebase, messaging services, taxes (if applicable) and future domain renewals are separate.",
    "BodyMuted",
))

doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
print(OUTPUT)
