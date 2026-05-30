---
name: renner-manual
description: >
  Answer any question about Lojas Renner buyer QC inspection requirements, defect codes,
  AQL sampling, RFID placement, hanger rules, logistics/packaging, POM measurements,
  children's safety, Inspectorio platform, CAPA process, shade evaluation, sealed samples,
  and real inspection scenarios. Use this skill when the user asks about:
  - Renner defect codes (VA, VB, VC, VD, VE, VF, VG, VH, VI, VQ, VU, VM, VR, VT, VX, VW, RF, ME)
  - AQL sampling levels, NQA values, accept/reject numbers
  - RFID models (COS01, ADE01, ADE02) and placement rules
  - Hanger models (SH41N, SH41R, 6212, LCT series) and which product uses which
  - Inspection pillars (Logistical, Operational, Visual, Dimensional)
  - Packaging/logistics rules (box sizes, label specs, folding rules)
  - POM measurement definitions (300-910 series)
  - Children's safety rules (VX codes, cord length limits)
  - Inspectorio scheduling, CAPA, concession process
  - Sealed sample rules (VW codes, Youcom Menswear exception)
  - Gray scale evaluation for garments, denim, footwear
  - Shade variation reporting format
  - Real QC field situations (seal sample missing, PO portal down, goods not ready, etc.)
  - Inspector mistakes and how to avoid them
  - Renner brand division rules (Renner / Youcom / Ashua)
  Trigger on any Renner QC question from inspector, manager, or agent.
  This skill covers: Garments V11, Footwear R26, Bags V8, Jewelry V8, Eyeglasses V7,
  Various Accessories V6, Children Safety V4, Logistics V7, POM V6, Inspectorio Mar2026.
---

## APPENDIX A — OFFICIAL DATA SOURCE REGISTRY

### 1. Master Question Bank Google Sheet
- **File Name on Drive:** Lojas Renner Inspection record format.xlsx
- **Live Link:** [Lojas Renner Inspection record format.xlsx](https://docs.google.com/spreadsheets/d/1Xl25mc1Dj53Bd4cy0d_wJzwC8K8ewFeP/edit?usp=drive_link)

### 2. Master Daily Tips Reference Sheet
- **File Name on Drive:** Renner_QC_New_300_Questions
- **Live Link:** [Renner_QC_New_300_Questions](https://docs.google.com/spreadsheets/d/1p4rsJ8yhb53bzX7MgM0IMXb5ilRctfo7ZuupXGCBWbY/edit?usp=drive_link)

### 3. Notion Central Knowledge Hub
- **Main Hub:** [Renner Buyer Manual Hub](https://jewel-twister-362.notion.site/Renner-Buyer-Manual-Hub-36e8d6bb56b181e3bbbfeb0d4eb4314c)
- **User Guide:** [User Guide: How to Use renner-manual.skill](https://jewel-twister-362.notion.site/User-Guide-How-to-Use-renner-manual-SKILL-36e8d6bb56b181058922e23244c9dc84)
- **Active Manual Directory:** [Active Manual Directory](https://jewel-twister-362.notion.site/b25d3ec2d3514f98a2a2ae26a1b03a4c?v=63f44ae325d244cd95927f243b827766)

### 4. Consolidated OneDrive Master Output
- **File Name:** Movimoda_Renner_QC_TrainingBank_v1_2026.xlsx
- **Local Path:** [OneDrive Master Folder](file:///C:/Users/Tanvir/OneDrive%20-%20Movimoda/Asia-Pacific%20-%20QA_QC/OTHER%20CUSTOMERS/IN-LINE/LOJAS%20RENNER/My%20master%20Q%26A%20sheet/)

---

# Renner Buyer Manual — Complete QC Knowledge Base

**Buyer:** Lojas Renner S.A. (Brazil) | **Brands:** Renner · Youcom · Ashua
**Office:** Movimoda Asia-Pacific — Dhaka, Bangladesh
**Platform:** Inspectorio | **PLM:** Centric PLM | **NPF:** portaldofornecedor.lojasrenner.com.br
**Last Manual Update:** V11 Garments Jan 2026 / R26 Footwear Apr 2026 / V7 Logistics Feb 2026

---

## Q&A REFERENCE BANK
For specific field situations, inspector mistakes, Youcom Menswear edge cases, and CAPA platforms questions, please refer to the Master Q&A Bank:
- File Link: [RENNER_QA_BANK.md](file:///C:/Users/Tanvir/.gemini/config/skills/_renner-manual.skill/RENNER_QA_BANK.md)
- Source Link: [RENNER_QA_BANK.md](file:///C:/Users/Tanvir/Office_AI/MD%20file/RENNER_QA_BANK.md)

---

## PART 1 — THE 4 PILLARS OF INSPECTION

Every Renner inspection is evaluated on 4 pillars. ALL must pass.

| Pillar | What It Covers | Fail = ? |
|--------|---------------|----------|
| **Logistical** | Box specs, label placement, packing method | Entire shipment held |
| **Operational** | Hanger, price tag, RFID, care label, legislation | AQL sampling |
| **Visual** | Defects on garment (Zone A and B) | AQL sampling |
| **Dimensional** | Measurements vs size chart | AQL sampling |

**Rule:** Inspector must evaluate ALL 4 pillars. Missing any pillar = incomplete report.

---

## PART 2 — AQL SAMPLING RULES

### Garments & Textile Accessories (V11)
- Visual + Operational: Level **S4**, NQA **2.5** Major / **4.0** Minor
- Dimensional: Level **S4**, Accept 0 / Reject 1 per measurement point

### All Accessories (Bags, Jewelry, Eyeglasses, Various)
- Visual + Operational: Level **S4**, NQA **1.5** Major / **2.5** Minor
- **Tighter than garments!**

### Footwear (R26)
- Visual + Operational: Level **S4**, NQA **2.5** Major / **4.0** Minor
- Measured in **PAIRS** — not individual pieces

### Logistics (All categories)
- 3 SKUs sample: Accept **0** / Reject **1**
- Operational per SKU: Accept **0** / Reject **1**

### Belts (Dimensional only)
- Tolerance: ±0.5 cm
- Sample: 20 pcs (batch 2-2000) / 30 pcs (2001-4000) / 40 pcs (>4000)
- Accept/Reject: 1/2, 2/3, 3/4

---

## PART 3 — RFID RULES

| Model | Type | Where to Place | Used For |
|-------|------|---------------|----------|
| **COS01** | Sewn | Behind legal label, between label and garment | Garments with seams |
| **ADE01** | Adhesive | Inside RIGHT shoe outsole (between insole & outsole, NOT on metallic shank) | Footwear |
| **ADE02** | Adhesive | Any position that does not interfere with appearance | Accessories, glasses, jewelry, no-seam products |

**Critical RFID Rules:**
- ADE01 must be applied **AFTER all heat processes** (lasting, vulcanizing, etc.)
- Youcom Security Tag (footwear): **Left shoe** outsole (same position as ADE01 on right)
- If ANY product has deactivated/missing alarm tag → **entire order returned**
- RF1 = More than one RFID per item = **Critical**
- RF2 = Incorrect info on RFID = **Critical**
- RF4 = RFID interfering with appearance = **Critical**
- VD11 = RFID missing/falling off = **Critical**
- VD13 = RFID different from specified = **Critical**

---

## PART 4 — HANGER RULES (GARMENTS)

| Model | Size | Used For |
|-------|------|---------|
| **SH41N-G** | 41cm | Men's & Women's Tops, Dresses (Renner + Ashua) |
| **SH41N-W** | 41cm | LOV Noite Tops (Youcom Women's) |
| **SH41R-G** | 41cm | Straight-cut garments, Blazers |
| **6212-G** | 30cm | Small Bottoms, Swimwear, Underwear |
| **LCT1530** | Kids | Poim brand children's |
| **LCT1526** | Kids | Teddy Boom brand children's |
| **LCT1536** | Kids | Fuzarka brand children's |

**Hanger Defect Codes:**
- VA1 = Hanger missing = **Critical**
- VA4 = Hanger different from specified = **Critical**
- VA5 = Hanger damaged = **Critical**
- ME4 = Hanger strap missing/non-functional = **Major**
- ME5 = Hanger strap model different from specified = **Major**

**Hanger Strap Positioning:**
- Tops: ±1cm from inner edges, aligned with shoulder line
- Bottoms: upper portion of side seams, ±1cm from finishing edge

**Rental Contact:** csc.operacoesdecabides@lojasrenner.com.br

---

## PART 5 — LABEL & LEGAL REQUIREMENTS

### Care Label Rules
- Composition MUST include lining
- Panty lining: always **100% COTTON** (except seamless)
- Fibers <5%: use "OUTRA FIBRA" / "OTRA FIBRA"
- Multiple fibers <15% total: use "OUTRAS FIBRAS"
- **Forbidden fiber names:** Nylon, Lycra, Spandex, PU, PET — use generic names only
- Character height minimum: **2mm** (garments) / **1mm** (accessories/jewelry)

### Origin Labels
- Bangladesh origin: "FEITO EM BANGLADESH" (Brazil) / "HECHO EN BANGLADESH" (Argentina)
- Must be on BOTH shoes for footwear (ABNT 16679 — effective **July 31, 2026**)

### Price Tag Rules
- VT1 = Price tag missing = **Critical**
- VT7 = Price tag different from specified = **Critical**
- VT3 = Price tag damaged = **Critical**

### ⚠️ BARCODE SCANNING RULE (Active from May 2026)
When scanning price tag barcode, system shows an additional "0" prefix before the actual code — this is **normal and acceptable**. The remaining barcode data corresponds correctly.
**Action:** Always mention in Final Remarks: *"Barcode scanning on the price tag reflects an additional '0' prefix before the actual code, while the remaining barcode data corresponds correctly."*

---

## PART 6 — GRAY SCALE EVALUATION

### Garments (V11)
| Fabric Type | Between Components | Between Pieces |
|------------|-------------------|----------------|
| Solid / Print | Min **4** | Min **3** |
| Denim / Washes / Twill | Min **2** | Min **2** |

### Footwear (R26)
| Material | Between Components | Between Pairs |
|----------|-------------------|---------------|
| Leather | Min **3** | Min **2/3** |
| Other / Textile | Min **4** | Min **3/4** |

### Shade Variation Reporting Format (Required)
Always report shade in this format:
> *"Garment body shade compared with seal sample: approximately [X]% within Gray Scale [grade], [Y]% at Gray Scale [grade] (lighter/darker). Overall shade range [acceptable/not acceptable]. Kindly request buyer review and advise."*

**Example (Tanvir standard format):**
> *"Garment body shade compared with seal sample shows variation; approximately 80% within Gray Scale 3–4 and 10% at Gray Scale 2/3 (lighter) and 10% found darker from sample, Gray Scale 2. Overall shade range acceptable with satisfactory consistency. Kindly request buyer review and advise."*

---

## PART 7 — SEALED SAMPLE RULES (VW CODES)

| Code | Defect | Criticality |
|------|--------|-------------|
| VW2 | Sealed sample missing | Critical |
| VW6 | Sealed sample missing (Youcom) | Critical |
| VW7 | Sealed sample damaged | Critical |
| VW8 | Bulk different from sealed sample | Critical |

### ⚠️ CRITICAL RULE — Youcom Menswear Exception (May 2026)
**Sealed samples are NOT mandatory for Youcom Menswear orders.**
This requirement applies **ONLY to Womenswear.**
Do NOT score VW6 for Youcom Menswear orders.

**How to identify:**
- Check PO — it will indicate Men's or Women's division
- Youcom Menswear = NO sealed sample required
- Youcom Womenswear = sealed sample REQUIRED

---

## PART 8 — COMPLETE DEFECT CODE REFERENCE

### Operational Defects
| Code | Defect | Criticality |
|------|--------|-------------|
| VA1 | Hanger missing | Critical |
| VA4 | Hanger different from specified | Critical |
| VA5 | Hanger damaged | Critical |
| VT1 | Price tag missing | Critical |
| VT7 | Price tag different from specified | Critical |
| VT3 | Price tag damaged | Critical |
| VF2 | Non-compliant with legislation | Critical |
| VF10 | Incorrect care label composition | Critical |
| VF12 | Incorrect item | Critical |
| VF13 | Incorrect information on label | Critical |
| VB2 | Wrong brand/size label | Critical |
| VC2 | Care label missing | Critical |
| VC3 | Care label inappropriate position | Critical |
| VX23 | Packaging without suffocation warning | Critical |
| VD5 | RFID damaged | Critical |
| VD11 | RFID missing/falling off | Critical |
| VD13 | RFID different from specified | Critical |
| VD9 | RFID obstructing information | Critical |
| RF1 | More than one RFID per item | Critical |
| RF2 | Incorrect info on RFID | Critical |
| RF4 | RFID interfering with appearance | Critical |
| ME2 | Missing measurement chart | Critical |
| ME3 | Incomplete/incompatible chart | Critical |
| ME6 | Missing internal safety button/hook | Critical |

### Visual Defects — Garments (Zone A = Major, Zone B = Minor unless noted)
| Code | Defect | Zone A | Zone B |
|------|--------|--------|--------|
| VV1 | Wet/moldy | Critical | Critical |
| VV2 | Unpleasant odor | Critical | Critical |
| VV12 | Dirty/stained Zone A | Major | — |
| VV13 | Dirty/stained Zone B | — | Minor |
| VG1 | Hole | Major | Major |
| VG2 | Torn/worn out | Major | Major |
| VG12 | Defective/flawed/incomplete print | Critical | Critical |
| VG17 | Lack of colorfastness | Critical | Critical |
| **VG34** | **Damaged synthetic material (NEW V11)** | **Critical** | **Critical** |
| VG11 | Pilling | Major | Major |
| VG22 | Raw material difference | Major | Major |
| VG32 | Color contrast contamination Zone A | Major | — |
| VG33 | Color contrast contamination Zone B | — | Minor |
| VQ4 | Shade difference within garment | Major | Major |
| VQ5 | Shade difference between garments | Major | Major |
| VU4 | Twisting beyond tolerance (max 2cm) | Major | Major |
| VU5 | Asymmetry beyond tolerance | Major | Major |
| VH2 | Coming unstitched | Major | Major |
| VH3 | Fabric slipping out | Major | Major |
| VH7 | Crooked seam | Minor | Minor |
| VH11 | Needle hole/feed dog marks | Minor | Minor |
| VH13 | Skipped stitch | Minor | Minor |
| VH32 | Uncut thread >3cm | Minor | Minor |
| VH35 | Missing belt loop/reinforcement | Major | Major |
| VH36 | Gathering/puckering Zone A | Major | — |
| VH37 | Gathering/puckering Zone B | — | Minor |
| VH40 | Missing/poorly executed backstitch | Major | Major |
| VH55 | Missing bar tack on fly/zipper reinforcement | Major | Major |
| VI1 | Defective zipper | Critical | Critical |
| VI4 | Damaged/broken component | Major | Major |
| VI5 | Missing/non-functional component | Major | Major |
| VI6 | Incorrectly positioned/asymmetrical | Major | Major |
| VI9 | Oxidized | Critical | Critical |
| VI10 | Missing spare button | Minor | Minor |
| VI37 | Button and tack from different manufacturers | Critical | Critical |
| VI46 | Incomplete plating/peeling | Major | Major |
| VM1 | Staining the garment | Major | Major |
| ME1 | Measurement different from specified | Major | — |
| ME4 | Hanger strap missing/non-functional | Major | — |

### Children's Safety Defects (VX Codes — V4)
| Code | Defect | Criticality |
|------|--------|-------------|
| VX3 | Tab below garment hem | Critical |
| VX4 | Non-continuous strap at neck/shoulder | Critical |
| VX6 | Embroidery without lining | **Minor** |
| VX7 | Belt longer than hem at back | Critical |
| VX8 | Adjustable/decorative cord tied at back | Critical |
| VX9 | Adjustable cord without bar tack | Critical |
| VX10 | Cord hanging at cuffs/ankles | Critical |
| VX11 | Cord at head/neck with free ends | Critical |
| VX12 | Fastener with free ends | Critical |
| VX13 | Rough interlining | **Minor** |
| VX14 | Velcro with sharp edges | **Minor** |
| VX15 | Zipper slider without internal protection (fly) | Critical |
| VX16 | Zipper slider without protection on skin | Critical |
| VX17 | Zipper without top end | Critical |
| VX19 | Zipper puller below garment edge | Critical |
| VX20 | Top end not functional | Critical |
| VX22 | Heat transfer on garments ≤3 years old | Critical |
| VX23 | Packing without suffocation warning | Critical |
| VX25 | Interactive application with liquid/small parts | Critical |
| VX26 | Elastic cord in head/neck area | Critical |
| VX27 | Garments with LED lights | Critical |
| VX28 | Sequin sewn with fewer stitches than required | Critical |
| VX29 | Garment with integrated feet, no slip-resistant material | Critical |

**Note:** VX5 and VX21 have been **DELETED** in V4. Do not use.

### Children's Safety POM Limits
| POM | Measurement | Max Allowed |
|-----|------------|-------------|
| 900 | Martingale/Flipper length | ≤ 7.5 cm |
| 901 | Untied belt length | ≤ 36 cm |
| 902 | Fixed cord length | ≤ 14 cm |
| 904 | Flat adjustable string length | ≤ 20 cm |
| 809 | Sash belt height | ≥ 3 cm |

---

## PART 9 — FUNCTIONAL TESTING RULES

### Zipper Test
- Open and close slider at **minimum 10 times** at normal speed (V11 Garments)
- Field update May 2026: **at least 5 times hard open and close**
- Use both counts — 5 hard = minimum field standard

### Button / Snap / Hook Test
- Open and close **all** buttons/snaps/hooks at least **5 times**, pull hard to test fastness

### Denim Flexible Button
- Pull test: **70N** on **3 pieces per SKU**
- Button and tack must be from **same manufacturer** (VI37 = Critical if different)

### Bar Tack Rules
- Denim/Twill bottoms with zipper = bar tack on fly **mandatory**
- Zipper reinforcement = Women's division woven/knit, 1.5–2cm above slider
- Belt loop reinforcement = Women's denim/twill with elastane, side belt loops only

### Velcro Test
- Attach and detach each one individually

### LED Footwear
- Rub against flat surface to verify functionality

---

## PART 10 — LOGISTICS & PACKAGING RULES (V7)

### Standard Box Sizes
| Box Type | Internal Dimensions | Max Weight | Used For |
|----------|--------------------|-----------|---------| 
| **Large** | 770 × 520 × 270 mm | 22.6 kg | SH41N, SH41R, 6212, 6214 hangers; socks, underwear, bras, swimwear |
| **Medium** | 530 × 370 × 270 mm | 22.6 kg | Folded adult & children's products; accessories |
| **Exception** | Non-standard OK | — | Handbags, Blazers, PU/Suede/Fake suede styles, Shoes |

### Logistics Label Specs
- Size: **50mm height × 100mm length**
- Position: Bottom-LEFT of longest side
- Distance from left: **50mm to 75mm**
- Distance from bottom: **45mm to 50mm**
- Font: **CALIBRI 11**
- Generated via: portaldofornecedor.lojasrenner.com.br
- **NO adhesive tape over barcode!**

### Product-Specific Packing Rules
| Product | Rule |
|---------|------|
| Denim/Twill bottoms | No hanger, no individual packaging — bulk bag directly in box |
| Delicate/light-colored denim | No hanger, BUT with individual packaging |
| Belts | Rolled up, individually wrapped; multi-belt kits = each belt wrapped first |
| **Jewelry** | **Individually packed in CLOSED/SEALED packaging — MUST NOT be open (risk of jamming DC automation!)** |
| Children's Puffer Jackets | WITH hanger, individually packaged AND FOLDED — hanger entirely inside packaging |
| Adult & Kids' Bathrobes | WITH hanger, individually packaged AND FOLDED — hanger entirely inside packaging |
| Footwear | Sales packaging OK; label on bottom-left of individual box |
| Sets (Top+Bottom) | Single individual packaging encompassing both pieces |

---

## PART 11 — INSPECTORIO PLATFORM RULES

### Scheduling Rules
- Book minimum **7 days** in advance
- Order validity: max **3 months** before delivery date
- Aborted inspection = no-show after **15 minutes tolerance** OR cancel before **3PM day prior**
- **3rd inspection requires Buyer authorization** — cannot be self-scheduled

### Inspection Readiness Requirements
- **100% quantity** ready at inspection time
- **80% packed** at inspection time
- Quantity tolerance: **±5% per SKU** (not total order)

### CAPA Process (After Fail)
- CAPA must be submitted **next working day** after fail
- Re-inspection MUST use **CAPA "Solve" button** — do NOT schedule as new inspection
- Concession orders remain "FAILED" in system even after approval
- Manual POM addition = **improper practice** — fines apply

### PO Portal Issues
If portaldofornecedor.lojasrenner.com.br is down:
1. Use **supplier-provided PO sheet** attached to booking/app
2. Mention reason in **Final Remarks**: *"Due to an error in the buyer-provided portal (portaldofornecedor.lojasrenner.com.br), we have used the supplier-provided PO sheet available in the booking attachment for inspection. This was done as advised internally by the Dhaka Renner office."*

### PLM System — Measurement Points
- Access: lrprod.centricsoftware.com (SSO Login)
- Contains: measurement tables with POM dimensions + tolerances
- **DO NOT edit measurement points in app** even if they don't match supplier
- Measurements are generated automatically from PLM — any changes may lead to inspection rejection
- Covers: Renner and Ashua brands ONLY (NOT Youcom)

---

## PART 12 — POM MEASUREMENT REFERENCE

### POM Categories
| Range | Category |
|-------|---------|
| 300–399 | Tops (Womenswear, Menswear, Kidswear) |
| 400–499 | Bottoms |
| 500–599 | Tops — Lingerie/Beachwear |
| 600–699 | Bottoms — Lingerie/Beachwear |
| 700–799 | Details (collars, pockets, buttons, zippers) |
| 800–871 | Accessories (bags, belts, hats, gloves, socks, caps) |
| 900–910 | Children's Safety measurements |
| **910** | **FLY WIDTH (NEW in V6)** |

### Critical POM Rules
- **Auxiliary POMs** (A suffix — e.g. 308A, 412A) = **NO tolerance, NO fail** — measurement reference only
- If auxiliary POM not on size chart = no need to measure, write in observations
- Always measure with garment **flat, no stretching**
- Tops: align by chest | Pants: align by hip
- Close all buttons and zippers before measuring
- Finishings (bias, piping, elastic at edge) = **included** in measurement
- Collars = **NOT included** in measurement

### Key POM Definitions (2025 Updates)
| POM | Name | Method |
|-----|------|--------|
| 300 | Front Length | HPS to hem, exclude finishing; straps = highest neckline point |
| 301 | Center Front | Neck to hem; waist seam/elastic = up to 1st seam |
| 324 | Stretched Neck | Stretch max, measure end to end — measure LAST after all neck POMs |
| 325 | External Front Neck Drop | HPS natural fold to neckline, ignore rib/trim; buttons = up to 1st button center |
| 403 | Waist | Flat, CB+CF aligned, side to side at top of waistband |
| 405 | Front Rise | Crotch/inseam up to waist including waistband; inner shorts = NO waistband |
| 411 | Thigh | 2cm below crotch/inseam, side to side |
| **412** | **Half Thigh (NEW)** | At half thigh height (412A = auxiliary height POM) |
| 506 | Cup Size | Center of cup to 1st seam; no cup = include bust volume |

---

## PART 13 — PRODUCT-SPECIFIC RULES

### Eyeglasses & Sunglasses (V7 RY26)
- Photometry test: minimum **400nm UV** — supplier must provide photometer
- VAC8 = Outside 400nm standard = **Minor**
- Price tag: attached to **RIGHT temple** (wearer's perspective)
- UV sticker: placed on **LEFT lens** (wearer's perspective)
- Permanent engraving on temple: Item code + Filter category number + Filter type (N/F/P)
- Warranty Certificate mandatory: includes CNPJ, origin in Portuguese, normative reference

### Jewelry & Hair Accessories (V8 RY26)
- **Lead maximum: 0.03%** by weight of metal (INMETRO Ordinance 123)
- **Cadmium maximum: 0.01%** by weight of metal
- Products displayed on **cards** — not hangers
- Legal label min **1mm** character height
- VV5 Dirty = **Minor** (different from garments!)

### Various Accessories (V6 R26)
- INMETRO seal required for **toys** and **school supplies**
- Capacity label mandatory for **cups and bottles**
- EAN/GTIN barcode required for **gift packaging**
- VI9 Oxidized = **Major** (NOT Critical like garments!)
- **Renner only** — Youcom does not carry this category

### Footwear (R26)
- **⚠️ ABNT 16679 Deadline: July 31, 2026**
- Both shoes MUST have permanent marking: size + country of origin + brand
- Failure = **VF2** (Non-compliant with legislation) = Critical
- Pairing: elastic band 16–25cm length
- If no attachment point: ribbon incorporated into structure

---

## PART 14 — REAL FIELD SITUATIONS & CORRECT RESPONSES

### Situation 1: Seal Sample Not Present at Factory
**Q:** Seal sample not arrived yet at factory. Goods ready. What to do?
**A:** Write email to buyer/office immediately. Do NOT start inspection without seal sample for categories that require it. Wait for seal sample to arrive. If Youcom Menswear → seal sample NOT mandatory, proceed normally.

### Situation 2: PO Portal (NPF) Not Working
**Q:** Cannot download PO from portaldofornecedor.lojasrenner.com.br. What to do?
**A:**
1. Use supplier-provided PO sheet from booking attachment in app
2. Mention in Final Remarks: *"Due to portal error, supplier-provided PO sheet from booking attachment was used. This was done as advised by Dhaka Renner office."*
3. Add screenshot of error as reference photo in report

### Situation 3: Goods Not Ready at Inspection Time
**Q:** Arrived at factory, goods not fully ready. What to do?
**A:**
- If goods NOT 100% ready and NOT 80% packed → Abort inspection
- Inform office: "Goods not ready as per booking. [X]% packed. Awaiting instruction."
- Wait for office instruction before proceeding or aborting
- If office approves to wait → document in report
- Abort = report in group chat with reason, factory name, PO numbers

### Situation 4: Hanger Loop Does Not Match Seal Sample
**Q:** Hanger loop shade different from sealed sample. How to report?
**A:**
Check gray scale between hanger loop and garment body:
- If shade difference = Gray Scale Grade ≥ minimum (denim min 2) → acceptable
- If below minimum → VA4 (wrong hanger) or VQ4 (shade difference)
- Report example: *"Hanger loop shade is acceptable for approximately 80% of garments. Around 20% show shade variation among components compared with garment body, evaluated at Gray Scale Grade 2 (minimum acceptable level) against seal sample. Due to this partial shade variation, kindly request buyer to review."*

### Situation 5: Asymmetry Defect — What Tolerance?
**Q:** Inspector found front-back high-low difference. Is it asymmetry? What tolerance?
**A:**
- **Twisting tolerance:** max **2 cm** (all divisions)
- **Stripe inclination tolerance:** max **1.5 cm**
- If asymmetry beyond these tolerances → **VU5** (Major)
- Front-back height difference = **VU5** asymmetry beyond tolerance
- Defect code in app: "Asymmetrical beyond tolerance"

### Situation 6: Number Sticker on Top Side of Garment
**Q:** Number/shade sticker visible on top side (collar area). What to score?
**A:**
- This is **VI5** (Missing/non-functional) or **VV12** (Dirty/stained Zone A) if sticker causes mark
- OR if factory confirms it is an intentional buyer-approved shade indicator applied to all pieces → mention in Final Remarks: *"Shade sticker under the collar has been applied for all garments which factory informed all buyer they apply this."*
- Always request buyer review in such cases

### Situation 7: Wrong PO Used for Inspection Reference
**Q:** Inspector used a different PO number as reference. What happens?
**A:** This is a **serious error** — buyer can remove inspector from project. Rule:
- ALWAYS verify PO number from scheduling details INCLUDING quantity and color allocation
- Compare inspection request data with actual booking before starting
- Wrong PO = incorrect quantity/color verification = buyer escalation risk
- If discovered mid-inspection → stop, inform office immediately

### Situation 8: Logistic Label — New Option in App
**Q:** Found new "Logistic Label" option in Inspectorio app. What to do?
**A:**
- Check barcode on logistic label — verify it is correct
- Take photo of logistic label
- Add BOTH photos (OK and Not OK if any issue) into logistic label section
- Verify label position: bottom-left of longest side, 50-75mm from left, 45-50mm from bottom

### Situation 9: CAPA Approved — Reinspection Needed?
**Q:** CAPA was approved by buyer. Do we schedule new inspection?
**A:**
- If **CAPA approved** (Case 1) → Supplier can proceed for shipment. NO new inspection needed.
- If **Reinspection requested** (Case 2) → Supplier must use CAPA **"Solve" button** to schedule. Do NOT create new inspection booking.
- Note: Reinspection cost is charged to **supplier**

### Situation 10: Measurement Points Not Loading from PLM
**Q:** Measurement points in app showing error / cannot load PO.
**A:**
- DO NOT manually edit measurement points in app
- Use supplier-provided PO sheet from booking attachment
- Mention in Final Remarks: *"PLM measurement data could not be loaded due to server error. Inspection proceeded using supplier-provided size chart from booking attachment."*
- Add screenshot of error as reference

---

## PART 15 — KEY CONTACTS

| Department | Email |
|-----------|-------|
| Women's Quality | qualidadefeminino@lojasrenner.com.br |
| Men's Quality | qualidademasculino@lojasrenner.com.br |
| Children's Quality | qualidadeinfantil@lojasrenner.com.br |
| Accessories Quality | qualidadeacessorios@lojasrenner.com.br |
| LEP (Lingerie) | qualidadelep@lojasrenner.com.br |
| Asia Quality | quality@lojasrenner.com.br |
| Lab | lab_qualidade@lojasrenner.com.br |
| Inspectorio | inspectorio@lojasrenner.com.br |
| Logistics | logistica.fornecedores@lojasrenner.com.br |
| Hanger Rental | csc.operacoesdecabides@lojasrenner.com.br |
| POM Questions | misael.souza@lojasrenner.com.br |
| Children Safety POMs | leticia.cunegato@lojasrenner.com.br |
| NPF Portal | portalfornecedores@lojasrenner.com.br |

---

## PART 16 — COMMON INSPECTOR MISTAKES (LESSONS LEARNED)

These are real cases from Movimoda Bangladesh team — must be avoided:

| Mistake | What Happened | Rule |
|---------|--------------|------|
| Wrong PO reference | Inspector used different PO without verifying quantity/color — inspector removed from project | Always verify PO number + quantity + color from scheduling before starting |
| VW6 on Youcom Menswear | Scored "Sealed Sample Missing" on Menswear orders — rejection reversed | Youcom Menswear = NO sealed sample required |
| Price label barcode | Did not compare PO code with label code — extra "0" not noticed — DC could not distribute | Always scan AND visually compare barcode with PO code |
| Shade quantity not reported | Reported shade difference but not how many pieces — buyer could not decide | Always report: exact quantity/percentage of pieces with shade issue |
| Manual POM editing | Edited measurement points in app to match supplier — inspection rejected | NEVER edit auto-generated PLM measurements |
| Report transparency | Inspector mentioned defect but not count — buyer escalated | Always mention full inspected bulk quantity with defect count |
| Logistic label photos | Did not take both OK and Not OK photos for logistic label | Always add both reference photos in logistic section |

---

## PART 17 — RESPONSE FORMAT FOR QC QUERIES

When answering a QC field question, always structure response as:

**Situation:** [Restate what the situation is]
**Rule:** [What the manual says]
**Action:** [What inspector should do right now]
**Remark Text:** [Exact text to write in Final Remarks if needed]
**Defect Code:** [If applicable: code + criticality]

---

## PART 18 — INSPECTION REPORT ANALYSIS CHECKLIST

When reviewing an inspection report, check:

**Operational:**
- [ ] Correct hanger model used?
- [ ] Price tag present and correct?
- [ ] RFID correct model and position?
- [ ] Care label composition correct?
- [ ] Legislation compliant (VF2)?
- [ ] Sealed sample checked (correct for brand/division)?

**Visual:**
- [ ] Zone A and Zone B evaluated separately?
- [ ] Gray scale rating matches fabric type tolerance?
- [ ] Shade variation reported with percentage breakdown?
- [ ] Barcode scanned and "0 prefix" mentioned in remarks?

**Dimensional:**
- [ ] Measurement chart from PLM (not manually edited)?
- [ ] Auxiliary POMs not counted as fails?
- [ ] Wearability POMs covered for this product type?

**Logistics:**
- [ ] Box size correct?
- [ ] Label position correct (50×100mm, CALIBRI 11, bottom-left)?
- [ ] Jewelry sealed packaging?
- [ ] Denim packed without hanger (bulk)?

**Report Quality:**
- [ ] Full inspected bulk quantity mentioned?
- [ ] Defect count per defect code mentioned?
- [ ] Final Remarks complete (barcode note, shade note, portal issue if any)?
- [ ] Photos: OK, Not OK, label, barcode, defects all present?

---

## PART 19 — INSPECTION SOP (STANDARD OPERATING PROCEDURE)

### Step 1 — Before Going to Factory
- Check Inspectorio booking: PO number + quantity + color allocation.
- Download PO sheet from NPF portal (`portaldofornecedor.lojasrenner.com.br`).
- Check PLM (`lrprod.centricsoftware.com`) for measurement chart.
- Review Renner manual for product category.
- Prepare ALL inspection tools.

### Step 2 — Booking Confirmation Rules
- **DO Confirm Booking when:**
  - Goods are 100% ready.
  - At least 80% of goods are packed.
  - Packing list is available.
  - Sealed sample is present at the factory (for required categories).
- **DO NOT Confirm Booking when:**
  - Goods are NOT ready.
  - Packing list has NOT been received.
  - Sealed sample is missing (for required categories).
- **Re-inspection:**
  - Must use the CAPA "Solve" button. NEVER create a new booking.

### Step 3 — At-Factory Process
- Verify PO number matches booking (quantity + color).
- Check sealed sample is present (if required).
- Receive packing list from supplier.
- Show PO sheet downloaded from NPF.
- Proceed: Logistical → Operational → Visual → Dimensional.
- Enter report in Inspectorio app via tablet and screen cast for submission.

### Step 4 — Tools Checklist
- **Supplier Must Provide:** Sealed sample, packing list, PO sheet (factory copy).
- **Inspector Must Bring:** High-quality camera tablet, gray scale, measurement tape, carton seal set, pencil/pen, and Movimoda gum tape (to seal cartons if quality FAILS).

---

## PART 20 — SEALED SAMPLE MANUAL (KB0035252 V2)
- **Document Code:** KB0035252 | **Version:** V2 (Effective May 2026–May 2028)
- **Applies to:** Dhaka, Shanghai, and Ho Chi Minh offices.
- **Drive Link:** [KB0035252 V2 PDF](https://drive.google.com/file/d/1mvQqUZIevHUoXj44rTUA5wpG8ZfpiJDV/view)

### Division Rules
- **RENNER brand:** Sealed sample is MANDATORY for all Bangladesh imported orders.
- **YOUCOM brand:**
  - Womenswear (Ladies): MANDATORY.
  - Menswear: NOT mandatory. (Do NOT score VW6 for Menswear orders).
- **ASHUA brand:** Sealed sample is MANDATORY for all divisions.

### Accessories Category Exceptions
- **MANDATORY for:** Textile accessories and garments (e.g., scarves, textile hats, etc.).
- **NOT mandatory for:** Footwear, costume jewelry, handbags, and office accessories.

### Evaluated with Sealed Sample (Visual Aspects Only)
- Raw material, color, components, details.
- Stitching details (pockets, embellishments, lapels, pleats, buttonholes).
- Pressing (creases, Italian hem; note that wrinkling is not considered).
- Bonding, hand feel, and elasticity.
- *Note:* Operational and dimensional aspects are NOT evaluated against the sealed sample.

### Seal Number & Position
- Seal number must match the PO color name exactly (e.g., "ANTHRACITE" instead of "BLACK").
