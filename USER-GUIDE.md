# RtR Control Tower — S\u1ED5 tay S\u1EED d\u1EE5ng / User Guide

> **Version:** 1.0 &bull; **Date:** 2026-02-24
> **App:** RtR Control Tower V1 &bull; Frontend Prototype
> **Stack:** Vite + React &bull; Bilingual Vi/En &bull; Dark/Light Theme

---

## M\u1EE5c L\u1EE5c / Table of Contents

1. [\u0110\u0103ng nh\u1EADp & Vai tr\u00F2 / Login & Roles](#1-dang-nhap--vai-tro)
2. [Giao di\u1EC7n ch\u00EDnh / Main Interface](#2-giao-dien-chinh)
3. [B\u1EA3ng \u0110i\u1EC1u Khi\u1EC3n / Control Tower](#3-bang-dieu-khien)
4. [V\u1EA5n \u0110\u1EC1 / Issues](#4-van-de)
5. [C\u1ED5ng Phase / Phase Gates](#5-cong-phase)
6. [B\u1EA3n \u0110\u1ED3 \u1EA2nh H\u01B0\u1EDFng / Impact Map](#6-ban-do-anh-huong)
7. [BOM & Nh\u00E0 Cung C\u1EA5p / BOM & Suppliers](#7-bom--nha-cung-cap)
8. [Test & Quy\u1EBFt \u0110\u1ECBnh / Testing & Decisions](#8-test--quyet-dinh)
9. [\u0110\u1ED9i Ng\u0169 / Team](#9-doi-ngu)
10. [Duy\u1EC7t / Review Queue](#10-duyet)
11. [Nh\u1EADt K\u00FD / Audit Log](#11-nhat-ky)
12. [C\u00E0i \u0110\u1EB7t / Settings](#12-cai-dat)
13. [Nh\u1EADp/Xu\u1EA5t D\u1EEF Li\u1EC7u / Import/Export](#13-nhap-xuat)
14. [Ph\u00EDm T\u1EAFt & M\u1EF9o / Shortcuts & Tips](#14-phim-tat)

---

## 1. \u0110\u0103ng nh\u1EADp & Vai tr\u00F2

### T\u00E0i kho\u1EA3n demo / Demo Accounts

| T\u00EAn / Name | Email | M\u1EADt kh\u1EA9u | Vai tr\u00F2 / Role |
|---|---|---|---|
| Qu\u1EF3nh Anh | quynh@rtr.vn | demo123 | **Admin** \u2014 To\u00E0n quy\u1EC1n |
| Minh Tu\u1EA5n | tuan@rtr.vn | demo123 | **PM** \u2014 Qu\u1EA3n l\u00FD d\u1EF1 \u00E1n |
| \u0110\u1EE9c Anh | anh@rtr.vn | demo123 | **Engineer** \u2014 K\u1EF9 s\u01B0 |
| L\u00EA H\u01B0\u01A1ng | huong@rtr.vn | demo123 | **Viewer** \u2014 Ch\u1EC9 xem |

### Ma tr\u1EADn quy\u1EC1n / Permission Matrix

| H\u00E0nh \u0111\u1ED9ng / Action | Admin | PM | Engineer | Viewer |
|---|:---:|:---:|:---:|:---:|
| Xem t\u1EA5t c\u1EA3 tab | \u2705 | \u2705 | \u2705 | \u2705 |
| T\u1EA1o issue (status = OPEN) | \u2705 | \u2705 | \u2014 | \u2014 |
| T\u1EA1o issue (status = DRAFT) | \u2014 | \u2014 | \u2705 | \u2014 |
| Duy\u1EC7t / Approve issue | \u2705 | \u2705 | \u2014 | \u2014 |
| \u0110\u00F3ng issue | \u2705 | \u2705 | Ch\u1EC9 issue c\u1EE7a m\u00ECnh | \u2014 |
| Toggle gate check | \u2705 | \u2705 | \u2014 | \u2014 |
| Chuy\u1EC3n phase | \u2705 | \u2705 | \u2014 | \u2014 |
| Xem chi ph\u00ED BOM | \u2705 | \u2705 | \u2014 | \u2014 |
| Xem Audit Log tab | \u2705 | \u2014 | \u2014 | \u2014 |
| Xem Review Queue tab | \u2705 | \u2705 | \u2014 | \u2014 |
| Import/Export d\u1EEF li\u1EC7u | \u2705 | \u2705 | \u2705 | \u2014 |

### C\u00E1ch \u0111\u0103ng nh\u1EADp / How to Login

1. M\u1EDF app \u2192 m\u00E0n h\u00ECnh \u0111\u0103ng nh\u1EADp xu\u1EA5t hi\u1EC7n
2. Nh\u1EADp **Email** + **M\u1EADt kh\u1EA9u** (ho\u1EB7c ch\u1ECDn t\u00E0i kho\u1EA3n demo nhanh)
3. Ch\u1ECDn ng\u00F4n ng\u1EEF **Vi** / **En** tr\u01B0\u1EDBc khi \u0111\u0103ng nh\u1EADp
4. Session l\u01B0u trong `localStorage` \u2014 \u0111\u00F3ng tab v\u1EABn gi\u1EEF \u0111\u0103ng nh\u1EADp

### Chuy\u1EC3n vai tr\u00F2 / Switch Role

- Nh\u1EA5n **avatar** g\u00F3c ph\u1EA3i tr\u00EAn \u2192 menu x\u1ED5 xu\u1ED1ng
- Ch\u1ECDn ng\u01B0\u1EDDi d\u00F9ng kh\u00E1c \u0111\u1EC3 chuy\u1EC3n vai tr\u00F2 nhanh
- H\u00E0nh \u0111\u1ED9ng \u0111\u01B0\u1EE3c ghi v\u00E0o Audit Log

---

## 2. Giao di\u1EC7n ch\u00EDnh

### Header (c\u1ED1 \u0111\u1ECBnh tr\u00EAn c\u00F9ng)

| Th\u00E0nh ph\u1EA7n | V\u1ECB tr\u00ED | Ch\u1EE9c n\u0103ng |
|---|---|---|
| Logo **R** + t\u00EAn app | Tr\u00E1i | Nh\u1EADn di\u1EC7n th\u01B0\u01A1ng hi\u1EC7u |
| **Project selector** | Gi\u1EEFa | Chuy\u1EC3n gi\u1EEFa PRJ-001 (X7 Surveyor) v\u00E0 PRJ-002 (A3 Agri) |
| **Vi / En** | Ph\u1EA3i | Chuy\u1EC3n ng\u00F4n ng\u1EEF to\u00E0n b\u1ED9 app |
| **Sun/Moon** | Ph\u1EA3i | Chuy\u1EC3n Dark/Light theme |
| **Bell** | Ph\u1EA3i | Th\u00F4ng b\u00E1o \u2014 ch\u1EA5m \u0111\u1ECF = ch\u01B0a \u0111\u1ECDc |
| **Avatar + t\u00EAn** | Ph\u1EA3i | Menu ng\u01B0\u1EDDi d\u00F9ng / chuy\u1EC3n role / \u0111\u0103ng xu\u1EA5t |
| **Clock** | Cu\u1ED1i | \u0110\u1ED3ng h\u1ED3 th\u1EDDi gian th\u1EF1c |

### Tab bar (cu\u1ED9n ngang tr\u00EAn mobile)

10 tab ch\u00EDnh, cu\u1ED9n ngang khi m\u00E0n h\u00ECnh h\u1EB9p. M\u1ED7i tab c\u00F3 icon + t\u00EAn + badge \u0111\u1EBFm.

### Theme & Ng\u00F4n ng\u1EEF

- **Dark mode** (m\u1EB7c \u0111\u1ECBnh): n\u1EC1n #060A0F, ch\u1EEF s\u00E1ng
- **Light mode**: n\u1EC1n #F8FAFC, ch\u1EEF t\u1ED1i
- L\u01B0u v\u00E0o `localStorage` \u2014 m\u1EDF l\u1EA1i gi\u1EEF nguy\u00EAn

---

## 3. B\u1EA3ng \u0110i\u1EC1u Khi\u1EC3n / Control Tower

**Tab \u0111\u1EA7u ti\u00EAn** \u2014 T\u1ED5ng quan to\u00E0n b\u1ED9 d\u1EF1 \u00E1n.

### 6 Metric Card (tr\u00EAn c\u00F9ng)

| Metric | \u00DD ngh\u0129a |
|---|---|
| **Projects** | T\u1ED5ng s\u1ED1 d\u1EF1 \u00E1n (2) |
| **Open** | V\u1EA5n \u0111\u1EC1 \u0111ang m\u1EDF (ch\u01B0a \u0111\u00F3ng) |
| **Critical** | V\u1EA5n \u0111\u1EC1 m\u1EE9c Nghi\u00EAm tr\u1ECDng |
| **Blocked** | V\u1EA5n \u0111\u1EC1 b\u1ECB ch\u1EB7n |
| **Closure** | T\u1EF7 l\u1EC7 \u0111\u00F3ng (%) |
| **Cascade Alerts** | V\u1EA5n \u0111\u1EC1 g\u00E2y hi\u1EC7u \u1EE9ng d\u00E2y chuy\u1EC1n |

### Project Card (m\u1ED7i d\u1EF1 \u00E1n 1 th\u1EBB)

- **Phase Timeline**: CONCEPT \u2192 EVT \u2192 DVT \u2192 PVT \u2192 MP
  - V\u00F2ng tr\u00F2n xanh l\u00E1 = \u0111\u00E3 qua, v\u00E0ng/t\u00EDm = \u0111ang th\u1EF1c hi\u1EC7n, x\u00E1m = ch\u01B0a t\u1EDBi
  - Ng\u00E0y v\u00E0ng + icon tam gi\u00E1c = milestone b\u1ECB d\u1ECBch
- **Mini Metrics**: Open, Critical, Gate Progress, Cascade

### Cascade Alerts Panel

Hi\u1EC3n th\u1ECB \u0111\u00E2y chuy\u1EC1n tr\u1EC5 c\u1EE7a t\u1EEBng issue:
```
ISS-001 [CRITICAL] → DVT +2w → PVT +2w → MP +2w
```

### N\u00FAt Export

- **Export PDF**: T\u1EA1o PDF t\u1ED5ng quan d\u1EF1 \u00E1n
- **Executive Slides**: T\u1EA1o slide b\u00E1o c\u00E1o cho CEO/Board

---

## 4. V\u1EA5n \u0110\u1EC1 / Issues

### B\u1ED9 l\u1ECDc / Filters (thanh d\u00EDnh tr\u00EAn)

3 nh\u00F3m filter chip:
- **Tr\u1EA1ng th\u00E1i**: T\u1EA5t c\u1EA3, Nh\u00E1p, M\u1EDF, \u0110ang x\u1EED l\u00FD, B\u1ECB ch\u1EB7n, \u0110\u00E3 \u0111\u00F3ng
- **M\u1EE9c \u0111\u1ED9**: T\u1EA5t c\u1EA3, Nghi\u00EAm tr\u1ECDng, Cao, Trung b\u00ECnh, Th\u1EA5p
- **Ngu\u1ED3n**: T\u1EA5t c\u1EA3, N\u1ED9i b\u1ED9, B\u00EAn ngo\u00E0i, Li\u00EAn nh\u00F3m

**N\u00FAt "Xo\u00E1 l\u1ECDc"** (m\u00E0u \u0111\u1ECF) xu\u1EA5t hi\u1EC7n khi b\u1EA5t k\u1EF3 filter n\u00E0o kh\u00E1c "T\u1EA5t c\u1EA3".

### B\u1EA3ng Issues

- C\u1ED9t: M\u00E3, Ti\u00EAu \u0111\u1EC1/Nguy\u00EAn nh\u00E2n, Tr\u1EA1ng th\u00E1i, M\u1EE9c \u0111\u1ED9, Ngu\u1ED3n, Ch\u1ECBu TN, Phase
- **Header c\u1ED1 \u0111\u1ECBnh** khi cu\u1ED9n
- Click v\u00E0o h\u00E0ng \u2192 m\u1EDF chi ti\u1EBFt b\u00EAn d\u01B0\u1EDBi
- **\u0110\u1ED5i tab v\u00E0 quay l\u1EA1i \u2192 gi\u1EEF nguy\u00EAn l\u1EF1a ch\u1ECDn** (context preservation)

### Chi ti\u1EBFt Issue

- **Th\u00F4ng tin**: Owner, Phase, Due Date, Created
- **Nguy\u00EAn nh\u00E2n g\u1ED1c**: V\u1EA1ch v\u00E0ng b\u00EAn tr\u00E1i
- **B\u1EA3n \u0111\u1ED3 \u1EA3nh h\u01B0\u1EDFng**: \u0110\u1ECF, hi\u1EC3n th\u1ECB phase b\u1ECB \u1EA3nh h\u01B0\u1EDFng + s\u1ED1 tu\u1EA7n d\u1ECBch
- **Nh\u1EADt k\u00FD ho\u1EA1t \u0111\u1ED9ng**: K\u1EBFt h\u1EE3p c\u1EADp nh\u1EADt th\u1EE7 c\u00F4ng + audit log t\u1EF1 \u0111\u1ED9ng

### Thao t\u00E1c v\u1EDBi Issue

| N\u00FAt | Ch\u1EE9c n\u0103ng | Quy\u1EC1n |
|---|---|---|
| **Duy\u1EC7t** (xanh l\u00E1) | DRAFT \u2192 OPEN | Admin, PM |
| **Start** | OPEN \u2192 IN_PROGRESS | Admin, PM, Engineer (ch\u1EE7 issue) |
| **\u0110\u00F3ng** (xanh l\u00E1) | * \u2192 CLOSED | Admin, PM, Engineer (ch\u1EE7 issue) |
| **X** | \u0110\u00F3ng panel chi ti\u1EBFt | T\u1EA5t c\u1EA3 |

M\u1ED7i thao t\u00E1c hi\u1EC3n **toast th\u00F4ng b\u00E1o** v\u00E0 ghi v\u00E0o audit log.

### T\u1EA1o Issue m\u1EDBi

- Nh\u1EA5n **"T\u1EA1o v\u1EA5n \u0111\u1EC1"** (ch\u1EC9 Admin/PM/Engineer)
- \u0110i\u1EC1n: Title (EN b\u1EAFt bu\u1ED9c), Title (VI), Severity, Source, Owner, Phase, Root Cause, Due Date
- Engineer t\u1EA1o \u2192 status DRAFT (c\u1EA7n duy\u1EC7t)
- Admin/PM t\u1EA1o \u2192 status OPEN (kh\u00F4ng c\u1EA7n duy\u1EC7t)

### Empty state

Khi kh\u00F4ng c\u00F3 issue n\u00E0o kh\u1EDBp b\u1ED9 l\u1ECDc:
- Icon + th\u00F4ng b\u00E1o "Kh\u00F4ng c\u00F3 v\u1EA5n \u0111\u1EC1 n\u00E0o"
- N\u00FAt **"Xo\u00E1 b\u1ED9 l\u1ECDc"** \u0111\u1EC3 reset nhanh

---

## 5. C\u1ED5ng Phase / Phase Gates

### V\u00F2ng \u0111\u1EDDi 5 Phase

```
CONCEPT \u2192 EVT \u2192 DVT \u2192 PVT \u2192 MP
```

M\u1ED7i phase c\u00F3 danh s\u00E1ch \u0111i\u1EC1u ki\u1EC7n c\u1EA7n \u0111\u1EA1t \u0111\u1EC3 chuy\u1EC3n sang phase ti\u1EBFp theo.

### Giao di\u1EC7n

- M\u1ED7i phase 1 section c\u00F3 **thanh ti\u1EBFn \u0111\u1ED9** (x/y passed)
- Badge: **GATE READY** (xanh l\u00E1) ho\u1EB7c **GATE BLOCKED** (\u0111\u1ECF)
- **DVT** c\u00F3 **4 nh\u00F3m test**: Flight Test, Environmental, EMC/EMI, Mechanical
  Hi\u1EC3n th\u1ECB theo l\u01B0\u1EDBi 2x2 v\u1EDBi icon ri\u00EAng

### Thao t\u00E1c

- **Click checkbox** \u0111\u1EC3 toggle \u0111i\u1EC7u ki\u1EC7n \u0111\u1EA1t/ch\u01B0a (Admin/PM)
- N\u00FAt **"Chuy\u1EC3n Phase"** xu\u1EA5t hi\u1EC7n khi t\u1EA5t c\u1EA3 \u0111i\u1EC1u ki\u1EC7n b\u1EAFt bu\u1ED9c \u0111\u00E3 \u0111\u1EA1t
- Phase \u0111\u00E3 qua: hi\u1EC3n th\u1ECB PASSED (xanh l\u00E1), kh\u00F4ng th\u1EC3 s\u1EEDa

---

## 6. B\u1EA3n \u0110\u1ED3 \u1EA2nh H\u01B0\u1EDFng / Impact Map

Hi\u1EC3n th\u1ECB t\u00E1c \u0111\u1ED9ng d\u00E2y chuy\u1EC1n c\u1EE7a m\u1ED7i issue l\u00EAn c\u00E1c phase.

### M\u1ED7i issue card hi\u1EC3n th\u1ECB:

- **Nguy\u00EAn nh\u00E2n g\u1ED1c** \u2192 m\u0169i t\u00EAn \u2192 **Phase b\u1ECB \u1EA3nh h\u01B0\u1EDFng** \u2192 m\u0169i t\u00EAn \u0111\u1ECF \u2192 **Phase cascade**
- V\u00ED d\u1EE5: LDO undersized \u2192 DVT +2w \u2192 PVT auto-shift \u2192 MP auto-shift

### Milestone Risk Summary

L\u01B0\u1EDBi 5 c\u1ED9t (CONCEPT\u2013MP), m\u1ED7i c\u1ED9t \u0111\u1EBFm s\u1ED1 issue ch\u1EB7n:
- S\u1ED1 \u0111\u1ECF = c\u00F3 issue ch\u1EB7n
- S\u1ED1 xanh = kh\u00F4ng c\u00F3 r\u1EE7i ro

---

## 7. BOM & Nh\u00E0 Cung C\u1EA5p

### Sub-tab: C\u00E2y BOM / BOM Tree

**C\u1EA5u tr\u00FAc c\u00E2y 3 c\u1EA5p:**
```
Level 0: Assembly (to\u00E0n b\u1ED9 drone)
  Level 1: Sub-assembly (Khung, Ngu\u1ED3n, Avionics, D\u00E2y \u0111i\u1EC7n...)
    Level 2: Component (Motor, ESC, Pin, C\u00E1nh qu\u1EA1t...)
```

**C\u00F4ng c\u1EE5:**
- **T\u00ECm ki\u1EBFm** (h\u1ED7 tr\u1EE3 ti\u1EBFng Vi\u1EC7t kh\u00F4ng d\u1EA5u \u2014 g\u00F5 "canh quat" t\u00ECm "C\u00E1nh qu\u1EA1t")
- **L\u1ECDc lo\u1EA1i**: MECHANICAL, ELECTRICAL, CONSUMABLE
- **L\u1ECDc lifecycle**: ACTIVE, NRND, EOL, OBSOLETE
- **N\u00FAt "Xo\u00E1 l\u1ECDc"** khi c\u00F3 filter \u0111ang \u00E1p d\u1EE5ng
- **Header c\u1ED1 \u0111\u1ECBnh** khi cu\u1ED9n danh s\u00E1ch
- **Tooltip** khi r\u00EA chu\u1ED9t l\u00EAn text b\u1ECB c\u1EAFt

**Panel chi ti\u1EBFt** (b\u00EAn ph\u1EA3i khi ch\u1ECDn part):
- Category, Quantity, Unit Cost, Total Cost
- Th\u00F4ng tin nh\u00E0 cung c\u1EA5p, Lead Time
- Alternate parts (n\u1EBFu c\u00F3)

**C\u1EA3nh b\u00E1o:**
- **EOL/Obsolete** \u2014 Badge \u0111\u1ECF/cam nh\u1EA5p nh\u00E1y
- **NRND** (Not Recommended for New Design) \u2014 Badge v\u00E0ng

### Sub-tab: T\u1ED5ng Chi Ph\u00ED / Cost Summary (Admin/PM)

- T\u1ED5ng chi ph\u00ED BOM, s\u1ED1 linh ki\u1EC7n, s\u1ED1 b\u1ED9 l\u1EAFp r\u00E1p
- Bi\u1EC3u \u0111\u1ED3 thanh chi ph\u00ED theo lo\u1EA1i (MECHANICAL, ELECTRICAL, CONSUMABLE)

### Sub-tab: Nh\u00E0 Cung C\u1EA5p / Suppliers

**Directory view**: Card grid, m\u1ED7i NCC hi\u1EC3n th\u1ECB:
- M\u00E3 NCC, t\u00EAn, tr\u1EA1ng th\u00E1i (QUALIFIED / PROBATION)
- \u0110\u00E1nh gi\u00E1 ch\u1EA5t l\u01B0\u1EE3ng (sao), t\u1EF7 l\u1EC7 giao \u0111\u00FAng h\u1EA1n

**Chi ti\u1EBFt NCC** (click v\u00E0o card):
- Li\u00EAn h\u1EC7: Ng\u01B0\u1EDDi, email, \u0111i\u1EC7n tho\u1EA1i, qu\u1ED1c gia
- Ch\u1EE9ng nh\u1EADn: ISO 9001, UL, IATF 16949...
- **B\u1EA3ng \u0111\u00E1nh gi\u00E1**: Quality rating, On-Time %, Defect Rate %
- **Linh ki\u1EC7n cung c\u1EA5p**: Danh s\u00E1ch part v\u1EDBi gi\u00E1 + lead time
- **L\u1ECBch s\u1EED giao h\u00E0ng**: Timeline v\u1EDBi status m\u00E0u s\u1EAFc

---

## 8. Test & Quy\u1EBFt \u0110\u1ECBnh

### Sub-tab: Bay Th\u1EED / Flight Tests

**Danh s\u00E1ch chuy\u1EBFn bay:**
- **L\u1ECDc**: Lo\u1EA1i test (ENDURANCE, STABILITY, PAYLOAD, SPEED, RANGE, ENVIRONMENTAL, INTEGRATION) + K\u1EBFt qu\u1EA3 (PASS, FAIL, PARTIAL, ABORTED)
- **N\u00FAt "Xo\u00E1 l\u1ECDc"** + Empty state v\u1EDBi h\u01B0\u1EDBng d\u1EABn
- **Header c\u1ED1 \u0111\u1ECBnh**
- Th\u1ED1ng k\u00EA nhanh: t\u1ED5ng chuy\u1EBFn bay, PASS, FAIL, PARTIAL

**Chi ti\u1EBFt chuy\u1EBFn bay** (click v\u00E0o h\u00E0ng):
- **Th\u00F4ng tin bay**: Ng\u00E0y, \u0111\u1ECBa \u0111i\u1EC3m, phi c\u00F4ng, m\u00E1y bay, th\u1EDDi gian, t\u1ED1c \u0111\u1ED9 max
- **D\u1EEF li\u1EC7u c\u1EA3m bi\u1EBFn**: 8 thanh progress v\u1EDBi c\u1EA3nh b\u00E1o (Battery, Current, Vibration, GPS, Wind, Temp)
- **B\u1EA5t th\u01B0\u1EDDng**: Timeline c\u00E1c anomaly v\u1EDBi severity
- **\u0110\u00EDnh k\u00E8m**: Video, Log, Photo
- **Issue li\u00EAn k\u1EBFt**: N\u00FAt click \u0111\u1EC3 nh\u1EA3y sang tab Issues
- **T\u1EA1o Issue t\u1EEB chuy\u1EBFn bay**: N\u00FAt \u0111\u1ECF xu\u1EA5t hi\u1EC7n khi k\u1EBFt qu\u1EA3 FAIL/PARTIAL v\u00E0 ch\u01B0a c\u00F3 issue

### Sub-tab: Quy\u1EBFt \u0110\u1ECBnh / Decision Records (ADR)

**Card x\u1EBFp ch\u1ED3ng**, click \u0111\u1EC3 m\u1EDF r\u1ED9ng:
- **Header**: M\u00E3, Ti\u00EAu \u0111\u1EC1, Phase, Status, Ng\u00E0y
- **Ph\u01B0\u01A1ng \u00E1n**: A/B/C v\u1EDBi Pros + Cons, ph\u01B0\u01A1ng \u00E1n \u0111\u01B0\u1EE3c ch\u1ECDn c\u00F3 vi\u1EC1n xanh l\u00E1 + nh\u00E3n "CH\u1ECCN"
- **L\u00FD do**: Gi\u1EA3i th\u00EDch chi ti\u1EBFt
- **\u1EA2nh h\u01B0\u1EDFng**: Timeline + Chi ph\u00ED
- **Li\u00EAn k\u1EBFt**: N\u00FAt nh\u1EA3y sang Issue / Flight Test / Gate

---

## 9. \u0110\u1ED9i Ng\u0169 / Team

L\u01B0\u1EDBi card th\u00E0nh vi\u00EAn, m\u1ED7i ng\u01B0\u1EDDi hi\u1EC3n th\u1ECB:
- T\u00EAn, vai tr\u00F2 (icon + text), d\u1EF1 \u00E1n
- S\u1ED1 vi\u1EC7c \u0111ang m\u1EDF (v\u00E0ng n\u1EBFu > 0, xanh n\u1EBFu 0)
- Badge CRIT (\u0111\u1ECF) n\u1EBFu c\u00F3 issue nghi\u00EAm tr\u1ECDng
- Badge BLOCK (\u0111\u1ECF \u0111\u1EADm) n\u1EBFu c\u00F3 issue b\u1ECB ch\u1EB7n

---

## 10. Duy\u1EC7t / Review Queue

**Ch\u1EC9 Admin v\u00E0 PM th\u1EA5y tab n\u00E0y.**

Hi\u1EC3n th\u1ECB c\u00E1c issue \u1EDF tr\u1EA1ng th\u00E1i **DRAFT** c\u1EA7n duy\u1EC7t:
- Th\u00F4ng tin issue: ID, severity, ti\u00EAu \u0111\u1EC1, nguy\u00EAn nh\u00E2n, owner, ng\u00E0y t\u1EA1o
- N\u00FAt **Duy\u1EC7t** (DRAFT \u2192 OPEN): Xanh l\u00E1
- N\u00FAt **Tr\u1EA3 l\u1EA1i**: \u0110\u1ECF

Khi kh\u00F4ng c\u00F3 issue ch\u1EDD duy\u1EC7t \u2192 th\u00F4ng b\u00E1o xanh l\u00E1 "Kh\u00F4ng c\u00F3 v\u1EA5n \u0111\u1EC1 ch\u1EDD duy\u1EC7t".

---

## 11. Nh\u1EADt K\u00FD / Audit Log

**Ch\u1EC9 Admin th\u1EA5y tab n\u00E0y.**

### Ch\u1EE9c n\u0103ng

- **L\u1ECDc** theo h\u00E0nh \u0111\u1ED9ng (ISSUE_CREATED, STATUS_CHANGED, GATE_TOGGLED, LOGIN, LOGOUT...) + theo ng\u01B0\u1EDDi d\u00F9ng
- **Xu\u1EA5t CSV**: Download to\u00E0n b\u1ED9 nh\u1EADt k\u00FD d\u1EA1ng CSV
- **X\u00F3a t\u1EA5t c\u1EA3**: X\u00F3a to\u00E0n b\u1ED9 log (c\u00F3 x\u00E1c nh\u1EADn)

### M\u1ED7i entry hi\u1EC3n th\u1ECB

- Th\u1EDDi gian (HH:MM:SS + ng\u00E0y)
- T\u00EAn ng\u01B0\u1EDDi d\u00F9ng + vai tr\u00F2
- Lo\u1EA1i h\u00E0nh \u0111\u1ED9ng (badge m\u00E0u)
- Entity ID + title
- Gi\u00E1 tr\u1ECB c\u0169 \u2192 gi\u00E1 tr\u1ECB m\u1EDBi (\u0111\u1ECF \u2192 xanh)

### C\u00E1c h\u00E0nh \u0111\u1ED9ng \u0111\u01B0\u1EE3c ghi nh\u1EADn

| H\u00E0nh \u0111\u1ED9ng | Khi n\u00E0o |
|---|---|
| ISSUE_CREATED | T\u1EA1o issue m\u1EDBi |
| ISSUE_STATUS_CHANGED | Thay \u0111\u1ED5i tr\u1EA1ng th\u00E1i |
| ISSUE_REVIEWED | Duy\u1EC7t issue (DRAFT \u2192 OPEN) |
| ISSUE_CLOSED | \u0110\u00F3ng issue |
| GATE_CHECK_TOGGLED | Toggle \u0111i\u1EC1u ki\u1EC7n gate |
| USER_LOGIN | \u0110\u0103ng nh\u1EADp |
| USER_LOGOUT | \u0110\u0103ng xu\u1EA5t |
| USER_ROLE_SWITCHED | Chuy\u1EC3n vai tr\u00F2 |

---

## 12. C\u00E0i \u0110\u1EB7t / Settings

### Email Preferences

C\u1EA5u h\u00ECnh th\u00F4ng b\u00E1o cho 7 lo\u1EA1i s\u1EF1 ki\u1EC7n:

| S\u1EF1 ki\u1EC7n | M\u00F4 t\u1EA3 |
|---|---|
| Critical issue created | V\u1EA5n \u0111\u1EC1 nghi\u00EAm tr\u1ECDng m\u1EDBi |
| Flight test FAIL | Bay th\u1EED th\u1EA5t b\u1EA1i |
| Cascade delay | Ph\u00E1t hi\u1EC7n delay d\u00E2y chuy\u1EC1n |
| Issue overdue | V\u1EA5n \u0111\u1EC1 qu\u00E1 h\u1EA1n |
| Gate condition passed | \u0110i\u1EC1u ki\u1EC7n c\u1ED5ng \u0111\u1EA1t |
| Issue assigned | Issue \u0111\u01B0\u1EE3c giao |
| Phase transition | Chuy\u1EC3n phase |

M\u1ED7i s\u1EF1 ki\u1EC7n c\u00F3 3 t\u00F9y ch\u1ECDn:
- **Email**: B\u1EADt/t\u1EAFt th\u00F4ng b\u00E1o email
- **In-App**: B\u1EADt/t\u1EAFt th\u00F4ng b\u00E1o trong \u1EE9ng d\u1EE5ng
- **T\u1EA7n su\u1EA5t**: Th\u1EDDi gian th\u1EF1c / H\u00E0ng ng\u00E0y / H\u00E0ng tu\u1EA7n

---

## 13. Nh\u1EADp/Xu\u1EA5t D\u1EEF Li\u1EC7u

### Import Wizard (5 b\u01B0\u1EDBc)

1. **Ch\u1ECDn lo\u1EA1i**: Issues, BOM, Flight Tests, Milestones
2. **T\u1EA3i file**: K\u00E9o th\u1EA3 ho\u1EB7c ch\u1ECDn file Excel (.xlsx, .xls, .csv)
3. **\u00C1nh x\u1EA1 c\u1ED9t**: Smart Column Mapper t\u1EF1 \u0111\u1ED9ng g\u1EE3i \u00FD, k\u00E9o th\u1EA3 \u0111\u1EC3 \u0111i\u1EC1u ch\u1EC9nh
4. **Xem tr\u01B0\u1EDBc**: B\u1EA3ng d\u1EEF li\u1EC7u \u0111\u00E3 \u00E1nh x\u1EA1, hi\u1EC3n th\u1ECB l\u1ED7i (n\u1EBFu c\u00F3)
5. **Nh\u1EADp**: X\u00E1c nh\u1EADn v\u00E0 nh\u1EADp d\u1EEF li\u1EC7u

### Export

| \u0110\u1ECBnh d\u1EA1ng | N\u01A1i d\u00F9ng | M\u00F4 t\u1EA3 |
|---|---|---|
| **Excel** | Issues, BOM, Flight Tests | File .xlsx v\u1EDBi c\u00E1c c\u1ED9t \u0111\u1EA7y \u0111\u1EE7 |
| **PDF** | Dashboard | B\u00E1o c\u00E1o PDF t\u1ED5ng quan d\u1EF1 \u00E1n |
| **Executive Slides** | Dashboard | Slide HTML t\u1ED5ng quan cho CEO/Board |
| **CSV** | Audit Log | Xu\u1EA5t to\u00E0n b\u1ED9 nh\u1EADt k\u00FD |

---

## 14. Ph\u00EDm T\u1EAFt & M\u1EF9o

### Ph\u00EDm t\u1EAFt / Keyboard Shortcuts

| Ph\u00EDm | Ch\u1EE9c n\u0103ng |
|---|---|
| **Escape** | \u0110\u00F3ng modal/panel hi\u1EC7n t\u1EA1i (\u01B0u ti\u00EAn: Import \u2192 Export \u2192 Issue detail \u2192 Create form \u2192 User menu \u2192 Notifications) |

### M\u1EF9o s\u1EED d\u1EE5ng / Tips

1. **\u0110\u1EC3 demo CEO**: \u0110\u0103ng nh\u1EADp Qu\u1EF3nh Anh (Admin) \u2192 xem \u0111\u01B0\u1EE3c t\u1EA5t c\u1EA3 tab + chi ph\u00ED
2. **T\u00ECm nhanh linh ki\u1EC7n Vi\u1EC7t**: G\u00F5 kh\u00F4ng d\u1EA5u trong BOM search (v\u00ED d\u1EE5: "bom" t\u00ECm "B\u01A1m m\u00E0ng")
3. **Theo d\u00F5i cascade**: V\u00E0o tab Impact Map \u0111\u1EC3 th\u1EA5y to\u00E0n b\u1ED9 hi\u1EC7u \u1EE9ng d\u00E2y chuy\u1EC1n
4. **Chuy\u1EC3n d\u1EF1 \u00E1n**: Nh\u1EA5n n\u00FAt d\u1EF1 \u00E1n \u1EDF header (RTR-X7 / RTR-A3)
5. **Xem l\u1ECBch s\u1EED**: M\u1EDF issue \u2192 cu\u1ED9n xu\u1ED1ng Nh\u1EADt k\u00FD Ho\u1EA1t \u0110\u1ED9ng
6. **Export b\u00E1o c\u00E1o**: V\u00E0o Dashboard \u2192 Export PDF ho\u1EB7c Executive Slides
7. **Ki\u1EC3m tra NCC**: V\u00E0o BOM & Suppliers \u2192 tab Suppliers \u2192 click NCC \u0111\u1EC3 xem scorecard
8. **Auto-issue t\u1EEB bay th\u1EED**: M\u1EDF chi ti\u1EBFt chuy\u1EBFn bay FAIL \u2192 nh\u1EA5n "T\u1EA1o Issue t\u1EEB chuy\u1EBFn bay n\u00E0y"
9. **Filter nhanh**: Click chip filter \u2192 click l\u1EA1i \u0111\u1EC3 b\u1ECF l\u1ECDc
10. **Mobile**: Tab bar cu\u1ED9n ngang, th\u00EDch h\u1EE3p m\u00E0n h\u00ECnh h\u1EB9p

---

## D\u1EEF li\u1EC7u m\u1EABu / Sample Data

### D\u1EF1 \u00E1n / Projects

| M\u00E3 | T\u00EAn | Phase | S\u1ED1 Issues | S\u1ED1 BOM Parts | S\u1ED1 Flight Tests |
|---|---|---|---|---|---|
| PRJ-001 | RTR-X7 Surveyor | DVT | 6 | 27 | 7 |
| PRJ-002 | RTR-A3 Agri Sprayer | EVT | 5 | 21 | 5 |

### Nh\u00E0 Cung C\u1EA5p / Suppliers

| M\u00E3 | T\u00EAn | Qu\u1ED1c gia | Quality | On-Time |
|---|---|---|---|---|
| ACM | ACM Composites | VN | 4.2\u2605 | 87% |
| DJX | DJX Motor Tech | VN | 4.5\u2605 | 93% |
| SZE | SZ Electronics | CN | 3.8\u2605 (PROBATION) | 78% |
| RBR | RBR Vietnam Rubber | VN | 4.0\u2605 | 95% |
| UBX | u-blox AG (NPP VN) | CH | 4.8\u2605 | 91% |

---

*\u0110\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng b\u1EDFi RtR Control Tower V1 \u2014 \u00A9 2026 Real-time Robotics*
