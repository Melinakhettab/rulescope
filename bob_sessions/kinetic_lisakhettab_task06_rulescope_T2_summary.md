# Task 06 hange request: @demo/tickets/T2-gdpr-deletion.pdfRepositories to analyze:- C:/Users/khett/rulescope/demo-workspace/novabank-api- C:/Users/khett/rulescope/demo-workspace/novabank-mobileProduce the Impact Brief.

---

**Status:** active  **Date:** 2026-09-26

---

### 👤 User

Change request: @demo/tickets/T2-gdpr-deletion.pdf
Repositories to analyze:
- C:/Users/khett/rulescope/demo-workspace/novabank-api
- C:/Users/khett/rulescope/demo-workspace/novabank-mobile
Produce the Impact Brief.

---

### 🤖 Assistant

> 🔧 called: use_skill



> 🔧 **use_skill** — impact-brief

### 🤖 Assistant

> 🔧 called: office_read



> 🔧 **office_read** — demo/tickets/T2-gdpr-deletion.pdf

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — Get-Content "demo/tickets/T2-gdpr-deletion.pdf" -Raw | Select-String -Pattern "[\x20-\x7E]+" -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | Where-Object { $_.Length -gt 3 } | Select-Object -First 200

### 🤖 Assistant

> 🔧 called: execute_command

The PDF is binary/compressed. Let me try to extract it with a proper PDF tool:

> 🔧 **execute_command** — python -c "
import sys
try:
    import pdfplumber
    with pdfplumber.open('demo/tickets/T2-gdpr-deletion.pdf') as pdf:
        for page in pdf.pages:
            print(page.extract_text())
except ImportError:
    print('pdfplumber not available')
    try:
        import PyPDF2
        with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                print(page.extract_text())
    except ImportError:
        print('PyPDF2 not available either')
"


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — python -c "
import zlib, re

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

# Find all compressed streams
streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
texts = []
for s in streams:
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        # Filter to readable text lines
        for line in text.split('\n'):
            line = line.strip()
            if len(line) > 5 and any(c.isalpha() for c in line):
                texts.append(line)
    except:
        pass

print('\n'.join(texts[:200]))
"


### 🤖 Assistant

> 🔧 called: execute_command

The PDF uses encoded text. Let me try another approach to decode it:

> 🔧 **execute_command** — python -c "
# Try to decode the hex character codes from the PDF stream
# The characters appear to use custom encoding - let's try to map glyph IDs
# First decode hex values
import zlib, re

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
texts = []
for s in streams:
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        # Extract all hex strings like <0031>
        hexes = re.findall(r'<([0-9A-Fa-f]{4})>', text)
        if hexes:
            chars = []
            for h in hexes:
                val = int(h, 16)
                # Map to ASCII: subtract offset
                # Try subtracting 3 (common for this type of encoding)
                c = val - 3
                if 32 <= c <= 126:
                    chars.append(chr(c))
                else:
                    chars.append('?')
            result = ''.join(chars)
            if any(c.isalpha() for c in result):
                texts.append(result)
    except Exception as e:
        pass

print('\n'.join(texts))
"


### 🤖 Assistant

> 🔧 called: execute_command

I can now decode the ticket text. Let me extract it more cleanly:

> 🔧 **execute_command** — python -c "
import zlib, re

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
for s in streams:
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        hexes = re.findall(r'<([0-9A-Fa-f]{4})>', text)
        if hexes:
            chars = []
            for h in hexes:
                val = int(h, 16)
                c = val - 3
                if 32 <= c <= 126:
                    chars.append(chr(c))
                elif c == 10 or c == 13:
                    chars.append('\n')
                else:
                    chars.append(' ')
            result = ''.join(chars)
            # Remove multiple spaces
            result = re.sub(r'  +', ' ', result).strip()
            if len(result) > 20 and result.count('?') < len(result) * 0.3:
                print(repr(result))
    except Exception as e:
        pass
"


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — python -c "
import zlib, re

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

# Let's look at the full character map - find actual text per MCID block
streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
for s in streams:
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        # Split by MCID blocks (paragraphs)
        mcid_blocks = re.split(r'/P <<.*?>>BDC', text)
        for block in mcid_blocks[1:]:  # skip first empty
            hexes = re.findall(r'<([0-9A-Fa-f]{4})>', block)
            if hexes:
                chars = []
                for h in hexes:
                    val = int(h, 16)
                    c = val - 3
                    if 32 <= c <= 126:
                        chars.append(chr(c))
                    else:
                        chars.append(' ')
                result = re.sub(r' +', ' ', ''.join(chars)).strip()
                if result:
                    print(result)
    except Exception as e:
        pass
"


### 🤖 Assistant

> 🔧 called: execute_command

The text is coming through with a character offset. The encoding shifts: "." → "N", "O"→"O", etc. Let me decode properly - I see `.OVA"ANK` = `NOVABANK`, `2EQUEST` = `REQUEST`:

> 🔧 **execute_command** — python -c "
# The offset appears different per character - let me try another offset
# .OVA -> NOVA means . (0x2E) -> N (0x4E), diff = 0x20 = 32
# But 'O' -> 'O' and 'V'->'V'... 
# Actually looking at the hex values: 
# N = 0x4E, from code <0051> => 0x51-3 = 0x4E = N ... yes that works
# But . = 0x2E, from code ... let me check first char

# The output shows .OVA = NOVA
# . (dot) has ascii 0x2E, N has ascii 0x4E - differs by 0x20 = 32
# But then O = 0x4F maps from 0x52 (R) -> 0x52-3 = 0x4F = O, correct
# So 0x31 -> 0x2E = '.', but N should be from 0x51 -> 0x4E
# Let me just check:
# 0x2E = '.' but we want 'N' = 0x4E
# The hex code was 0031 -> 0x31 - 3 = 0x2E = '.'
# For N (0x4E) we need code 0x51 = 0x4E+3

# OK so the mapping IS: char = code - 3
# Then '.OVA' literally came from codes 0031 004F 0056 0041 = '.OVA'
# But displayed text in PDF is encoded differently
# 
# The font has a custom encoding. Let me try to look for the ToUnicode CMap
import zlib, re

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

# Find ToUnicode streams
# Look for 'beginbfchar' which is CMap syntax
streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
for i, s in enumerate(streams):
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        if 'beginbfchar' in text or 'beginbfrange' in text:
            print(f'Stream {i}:')
            print(text[:3000])
    except:
        pass
"


### 🤖 Assistant

> 🔧 called: execute_command

Now I have the CMap. Let me decode the PDF properly:

> 🔧 **execute_command** — python -c "
import zlib, re

# Build the CMap
cmap = {}
# beginbfchar entries
cmap[0x0003] = chr(0x0020)  # space
cmap[0x0016] = chr(0x0033)  # '3'
cmap[0x001D] = chr(0x003A)  # ':'
cmap[0x002A] = chr(0x0047)  # 'G'
cmap[0x002C] = chr(0x0049)  # 'I'
cmap[0x002F] = chr(0x004C)  # 'L'
cmap[0x0035] = chr(0x0052)  # 'R'
cmap[0x0037] = chr(0x0054)  # 'T'
cmap[0x00B2] = chr(0x2014)  # em-dash
# beginbfrange entries
# <000B> <000C> <0028>  => 0x000B->0x28='(', 0x000C->0x29=')'
for i, base in [(0x000B, 0x0028), (0x000C, 0x0029)]:
    cmap[i] = chr(base)
# <000F> <0011> <002C> => 002C=',', 002D='-', 002E='.'
for i, code in enumerate(range(0x000F, 0x0012)):
    cmap[code] = chr(0x002C + i)
# <0013> <0014> <0030> => '0','1'
for i, code in enumerate(range(0x0013, 0x0015)):
    cmap[code] = chr(0x0030 + i)
# <0023> <0028> <0040> => '@','A','B','C','D','E'
for i, code in enumerate(range(0x0023, 0x0029)):
    cmap[code] = chr(0x0040 + i)
# <0031> <0033> <004E> => 'N','O','P'
for i, code in enumerate(range(0x0031, 0x0034)):
    cmap[code] = chr(0x004E + i)
# <0044> <0048> <0061> => 'a','b','c','d','e'
for i, code in enumerate(range(0x0044, 0x0049)):
    cmap[code] = chr(0x0061 + i)
# <004A> <004C> <0067> => 'g','h','i'
for i, code in enumerate(range(0x004A, 0x004D)):
    cmap[code] = chr(0x0067 + i)
# <004E> <005C> <006B> => 'k','l','m','n','o','p','q','r','s','t','u','v','w','x','y'
for i, code in enumerate(range(0x004E, 0x005D)):
    cmap[code] = chr(0x006B + i)

with open('demo/tickets/T2-gdpr-deletion.pdf', 'rb') as f:
    data = f.read()

streams = re.findall(b'stream\r?\n(.*?)\r?\nendstream', data, re.DOTALL)
for s in streams:
    try:
        decompressed = zlib.decompress(s)
        text = decompressed.decode('latin-1', errors='ignore')
        mcid_blocks = re.split(r'/P <<.*?>>BDC', text)
        for block in mcid_blocks[1:]:
            hexes = re.findall(r'<([0-9A-Fa-f]{4})>', block)
            if hexes:
                chars = []
                for h in hexes:
                    val = int(h, 16)
                    chars.append(cmap.get(val, '?'))
                result = ''.join(chars).strip()
                if result and result != ' ' * len(result):
                    print(result)
    except:
        pass
"


### 🤖 Assistant

> 🔧 called: update_todo_list

Excellent! Now I have the full ticket text. Let me proceed with Step 2 and Step 3 in parallel:

> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[-] Step 2: Map repositories with find_cross_repo_links
[ ] Step 3: Analyze both repositories in parallel (subagents)
[ ] Step 4: Merge results
[ ] Step 5: Simulate change
[ ] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_cross_repo_links



> 🔧 **mcp__rulescope__find_cross_repo_links** — ["C:/Users/khett/rulescope/demo-workspace/novabank-api","C:/Users/khett/rulescope/demo-workspace/novabank-mobile"]

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[-] Step 3: Analyze both repositories in parallel (subagents)
[ ] Step 4: Merge results
[ ] Step 5: Simulate change
[ ] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: spawn_subagent



> 🔧 **spawn_subagent** — explore

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[x] Step 3: Analyze both repositories in parallel (subagents)
[-] Step 4: Merge results and verify key files
[ ] Step 5: Simulate change
[ ] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_candidates

The subagent did thorough work. Let me verify a few key files directly to ground the evidence:

> 🔧 **mcp__rulescope__find_candidates** — ["C:/Users/khett/rulescope/demo-workspace/novabank-api","C:/Users/khett/rulescope/demo-workspace/novabank-mobile"]

### 🤖 Assistant

> 🔧 called: execute_command

The MCP tools can't reach the remote path. The subagent ran from a different context. Let me check what's accessible from this machine:

> 🔧 **execute_command** — Test-Path "C:/Users/khett/rulescope/demo-workspace/novabank-api"; Test-Path "C:/Users/lisak/rulescope/demo-workspace/novabank-api"

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[x] Step 3: Analyze both repositories in parallel (subagents)
[-] Step 4: Merge results and verify key files (using local path)
[ ] Step 5: Simulate change
[ ] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__find_candidates



> 🔧 **mcp__rulescope__find_candidates** — ["email","phone","iban","delete","erase","gdpr","personal","customer","retention","anonymize","anonymise"]

### 🤖 Assistant

> 🔧 called: read_file, read_file, read_file

Good, now I have direct evidence from the local paths. Let me read the critical files to confirm key details:

> 🔧 **read_file** — demo-workspace/novabank-api/src/db/customersRepo.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/retention/policy.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/logging/logger.ts

### 🤖 Assistant

> 🔧 called: read_file, read_file



> 🔧 **read_file** — demo-workspace/novabank-api/src/api/routes.ts

> 🔧 **read_file** — demo-workspace/novabank-mobile/src/analytics/events.ts

### 🤖 Assistant

> 🔧 called: read_file, read_file



> 🔧 **read_file** — demo-workspace/novabank-mobile/tests/analytics.test.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/compliance/amlReport.ts

### 🤖 Assistant

> 🔧 called: read_file, read_file



> 🔧 **read_file** — demo-workspace/novabank-mobile/src/services/api.ts

> 🔧 **read_file** — demo-workspace/novabank-api/src/notifications/templates.ts

### 🤖 Assistant

> 🔧 called: mcp__rulescope__git_context, mcp__rulescope__git_context, mcp__rulescope__git_context

Now let me get git context on the most critical lines and then run coverage:

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__git_context** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

### 🤖 Assistant

> 🔧 called: mcp__rulescope__coverage_map, mcp__rulescope__coverage_map



> 🔧 **mcp__rulescope__coverage_map** — C:/Users/lisak/rulescope/demo-workspace/novabank-api

> 🔧 **mcp__rulescope__coverage_map** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

### 🤖 Assistant

> 🔧 called: update_todo_list

Now let me run the simulation — Step 5:

> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[x] Step 3: Analyze both repositories in parallel (subagents)
[x] Step 4: Merge results and verify key files
[-] Step 5: Simulate change (before/after)
[ ] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__simulate_change



> 🔧 **mcp__rulescope__simulate_change** — C:/Users/lisak/rulescope/demo-workspace/novabank-mobile

### 🤖 Assistant

> 🔧 called: mcp__rulescope__simulate_change

Now simulate the naive fix (only fix `trackTransferInitiated`, leave `trackLimitReached` untouched) to expose the hidden duplicate:

> 🔧 **mcp__rulescope__simulate_change** — [{"file":"src/analytics/events.ts","search":"    properties: {\n      userId,\n      email,\n      iban,\n      amount,\n    },","replace":"    properties: {\n      userId,\n      amount,\n    },"}]

### 🤖 Assistant

> 🔧 called: execute_command

The simulation proves the hidden duplicate risk. Now get the current date and save the report:

> 🔧 **execute_command** — Get-Date -Format o

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[x] Step 3: Analyze both repositories in parallel (subagents)
[x] Step 4: Merge results and verify key files
[x] Step 5: Simulate change (before/after)
[-] Step 6: Save and present Impact Brief


### 🤖 Assistant

> 🔧 called: mcp__rulescope__save_impact_report



> 🔧 **mcp__rulescope__save_impact_report** — {
  "version": "1",
  "ticketId": "LEGAL-31",
  "title": "GDPR Right to Erasure — delete all personal data (email, phone, IBAN) within 30 days",
  "createdAt": "2026-09-26T19:36:26.709+02:00",
  "repositories": [
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
  ],
  "summary": "On customer request, all personal data (email, phone, IBAN) must be deleted within 30 days across all NovaBank systems. Currently no erasure path exists anywhere. PII is also leaked to application logs and to an external analytics endpoint, creating secondary data stores that DB deletion alone cannot clear. A hard regulatory conflict exists between GDPR Art. 17 (30-day erasure) and COMP-3 AML retention (10-year transaction history), which Legal must resolve before code is written.",
  "entryPoints": [
    {
      "repo": "novabank-api",
      "file": "src/api/routes.ts",
      "line": 30,
      "description": "HTTP router — no DELETE /api/customers/:id route exists; must be added"
    },
    {
      "repo": "novabank-api",
      "file": "src/db/customersRepo.ts",
      "line": 14,
      "description": "Customer data access layer — stores email, phone, IBAN; no delete or anonymise function"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/analytics/events.ts",
      "line": 9,
      "description": "Analytics events — emits raw email and IBAN to external analytics on every transfer (two emission sites)"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/services/api.ts",
      "line": 10,
      "description": "Mobile API client — no deleteAccount function exists"
    }
  ],
  "filesToChange": [
    {
      "repo": "novabank-api",
      "file": "src/db/customersRepo.ts",
      "lines": [14, 29],
      "reason": "Add anonymiseCustomer(id) (NULL PII fields) and deleteCustomer(id); gated by isEligibleForDeletion from retention/policy.ts",
      "coverage": 76
    },
    {
      "repo": "novabank-api",
      "file": "src/api/routes.ts",
      "lines": [64, 64],
      "reason": "Add DELETE /api/customers/:id — returns 204 on success, 409 when blocked by AML 10-year retention gate",
      "coverage": 97
    },
    {
      "repo": "novabank-api",
      "file": "src/logging/logger.ts",
      "lines": [10, 10],
      "reason": "Remove email and iban from log line — currently logs raw PII on every transfer; already-written logs are a separate remediation",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/customers/index.ts",
      "lines": [1, 1],
      "reason": "Re-export anonymiseCustomer and deleteCustomer from the new functions in customersRepo",
      "coverage": 0
    },
    {
      "repo": "novabank-mobile",
      "file": "src/analytics/events.ts",
      "lines": [9, 37],
      "reason": "BOTH trackTransferInitiated (L9-26) AND trackLimitReached (L28-37) emit raw email+IBAN; both must be masked in the SAME PR — naive single-function fix leaves PII leaking from the second function (proven by simulation)",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "tests/analytics.test.ts",
      "lines": [5, 19],
      "reason": "Tests currently ASSERT that PII is present; must be inverted to assert PII is absent. Must ship in same PR as events.ts fix.",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "src/services/api.ts",
      "lines": [24, 27],
      "reason": "Add deleteAccount(customerId) calling DELETE /api/customers/:id",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "src/screens/TransferScreen.ts",
      "lines": [1, 21],
      "reason": "Add Delete My Account UI action (GDPR user-facing right) calling deleteAccount and clearing local state",
      "coverage": 100
    }
  ],
  "filesToCheck": [
    {
      "repo": "novabank-api",
      "file": "src/retention/policy.ts",
      "lines": [1, 9],
      "reason": "BLOCKER — RETENTION_YEARS=10 (COMP-3 AML) directly conflicts with GDPR Art. 17 30-day erasure. Legal must confirm whether anonymisation satisfies both obligations before any code is written.",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/compliance/amlReport.ts",
      "lines": [19, 30],
      "reason": "0% test coverage; external nightly AML scheduler depends on transfers.toIban. Any schema change risks breaking regulatory reporting. Add tests before touching anything nearby.",
      "coverage": 0
    },
    {
      "repo": "novabank-api",
      "file": "src/db/accountsRepo.ts",
      "lines": [5, 15],
      "reason": "Returns raw IBAN in GET /api/accounts/:id. Product/Legal decision: should IBAN be masked on read?",
      "coverage": 97
    },
    {
      "repo": "novabank-api",
      "file": "src/db/transfersRepo.ts",
      "lines": [1, 32],
      "reason": "Transfers table stores toIban. Transfers cannot be deleted without breaking COMP-3 / COMP-7 AML retention. Anonymisation strategy must be defined by Legal.",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/notifications/templates.ts",
      "lines": [2, 3],
      "reason": "0% coverage; embeds toIban in transferConfirmed message text. Unknown whether downstream notification queue persists these messages as a secondary PII store.",
      "coverage": 0
    }
  ],
  "filesNotAffected": [
    {
      "repo": "novabank-api",
      "file": "src/fraud/rules.ts",
      "reason": "Fraud thresholds only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/transfers/limits.ts",
      "reason": "Transfer limit constants only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/cards/cardLimits.ts",
      "reason": "Card limit constants only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/db/db.ts",
      "reason": "Raw query abstraction — no PII logic"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/transfers/validateTransfer.ts",
      "reason": "Client-side amount validation only — no PII"
    }
  ],
  "contradictions": [
    {
      "description": "GDPR Art. 17 (erasure within 30 days) vs. COMP-3 AML retention (RETENTION_YEARS=10, src/retention/policy.ts:3, commit c9ba91fd by Bob Chen 2024-06-10). A customer with transfers in the last 10 years cannot be fully deleted without violating AML law.",
      "owner": "Legal / Compliance",
      "severity": "BLOCKER"
    },
    {
      "description": "Raw PII emitted to external analytics (src/analytics/events.ts — both trackTransferInitiated L19-20 and trackLimitReached L35). Deleting the DB row does NOT erase analytics records. Analytics provider must be contacted to implement a purge API; unknown whether historical data can be deleted.",
      "owner": "Product / Data-team",
      "severity": "HIGH"
    },
    {
      "description": "Raw PII (email + IBAN) written to application logs on every transfer (src/logging/logger.ts:10, commit 649c8074 by Alice Martin 2024-04-05). DB deletion does NOT scrub already-written log lines. Log retention/redaction policy required.",
      "owner": "Infra / Legal",
      "severity": "HIGH"
    }
  ],
  "openQuestions": [
    "Does anonymisation (NULLing email/phone/IBAN, keeping financial records) satisfy both GDPR Art. 17 AND COMP-3 AML retention simultaneously? Legal must confirm before coding.",
    "What is the log retention period, and can already-written log lines containing PII be scrubbed retroactively?",
    "Should IBAN be masked on GET /api/accounts/:id reads (src/db/accountsRepo.ts:12)? Product decision.",
    "Which team owns the analytics purge API? Can historical analytics records be deleted? What is the SLA?",
    "Where is phone number stored in the mobile app — only in the backend profile, or also in native storage (AsyncStorage, SQLite, SecureStore)?",
    "Does the notification queue system persist IBAN-containing messages (src/notifications/templates.ts:2)? Who owns that system?",
    "Unknown external consumers of novabank-api — verify with other teams whether additional services store or cache PII from this API."
  ],
  "simulationResults": [
    {
      "input": "trackTransferInitiated: email removed (naive fix — only this function patched)",
      "before": "FAIL — email present: 'user@example.com'",
      "after": "PASS",
      "note": "Naive fix works for this function"
    },
    {
      "input": "trackTransferInitiated: IBAN removed (naive fix)",
      "before": "FAIL — IBAN present",
      "after": "PASS",
      "note": "Naive fix works for this function"
    },
    {
      "input": "trackLimitReached STILL emits raw email (duplicate — not fixed by naive patch)",
      "before": "FAIL — email present",
      "after": "FAIL — email still present",
      "note": "Critical: naive single-function patch leaves trackLimitReached (L28-37) emitting PII unchanged"
    },
    {
      "input": "trackLimitReached STILL emits raw IBAN (duplicate — not fixed by naive patch)",
      "before": "FAIL — IBAN present",
      "after": "FAIL — IBAN still present",
      "note": "Critical: both functions must be patched in the same PR"
    }
  ],
  "riskLevel": "HIGH",
  "effortDays": 3,
  "changePlan": [
    "GATE: Obtain Legal sign-off that anonymisation satisfies both GDPR Art. 17 and COMP-3 AML retention — no code merged until this is resolved.",
    "SAFE-NOW (independent): Fix logger PII leak — remove email and iban from logTransferEvent in src/logging/logger.ts:10; coordinate with Infra on log scrubbing policy for already-written records.",
    "Add anonymiseCustomer(id) (NULLs email, phone, iban columns) and optionally deleteCustomer(id) to src/db/customersRepo.ts; gated by isEligibleForDeletion from retention/policy.ts.",
    "Add DELETE /api/customers/:id route to src/api/routes.ts — returns 204 on success, 409 when the AML retention gate blocks deletion; import from customers/index.ts.",
    "Update src/customers/index.ts to re-export the two new functions.",
    "Write tests for the new endpoint: 204 success, 409 within retention window, PII absent after anonymisation, existing transfer tests unaffected.",
    "SAME PR — Fix BOTH trackTransferInitiated AND trackLimitReached in src/analytics/events.ts to remove email and iban from properties. Fixing only one leaves the other emitting PII (proven by simulation).",
    "SAME PR as step 7 — Invert assertions in tests/analytics.test.ts: assert PII is absent, not present.",
    "Add deleteAccount(customerId) to src/services/api.ts calling the new DELETE /api/customers/:id.",
    "Add Delete My Account UI action to src/screens/TransferScreen.ts calling deleteAccount and clearing local state.",
    "Contact analytics provider: request historical PII purge API and confirm deletion SLA for existing analytics records.",
    "Investigate phone number storage in the mobile native layer (AsyncStorage, SQLite, SecureStore); include in deletion scope if found.",
    "Coordinate with AML scheduler team to verify COMP-7 reporting (src/compliance/amlReport.ts — 0% coverage) is unaffected by schema changes; add test coverage before any schema work near transfers.",
    "Audit notification queue system for persisted IBAN-containing messages (src/notifications/templates.ts:2); remediate if confirmed as a secondary PII store.",
    "Notify other teams: unknown external consumers may be caching PII from novabank-api responses."
  ]
}

### 🤖 Assistant

> 🔧 called: mcp__rulescope__save_impact_report



> 🔧 **mcp__rulescope__save_impact_report** — {
  "$schema": "https://rulescope/impact-report/v1",
  "version": "1",
  "ticketId": "LEGAL-31",
  "title": "GDPR Right to Erasure — delete all personal data (email, phone, IBAN) within 30 days",
  "createdAt": "2026-09-26T19:36:26.709+02:00",
  "repositories": [
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
  ],
  "summary": "On customer request, all personal data (email, phone, IBAN) must be deleted within 30 days across all NovaBank systems. Currently no erasure path exists anywhere. PII is also leaked to application logs and to an external analytics endpoint, creating secondary data stores that DB deletion alone cannot clear. A hard regulatory conflict exists between GDPR Art. 17 (30-day erasure) and COMP-3 AML retention (10-year transaction history), which Legal must resolve before code is written.",
  "entryPoints": [
    {
      "repo": "novabank-api",
      "file": "src/api/routes.ts",
      "line": 30,
      "description": "HTTP router — no DELETE /api/customers/:id route exists; must be added"
    },
    {
      "repo": "novabank-api",
      "file": "src/db/customersRepo.ts",
      "line": 14,
      "description": "Customer data access layer — stores email, phone, IBAN; no delete or anonymise function"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/analytics/events.ts",
      "line": 9,
      "description": "Analytics events — emits raw email and IBAN to external analytics on every transfer (two emission sites)"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/services/api.ts",
      "line": 10,
      "description": "Mobile API client — no deleteAccount function exists"
    }
  ],
  "filesToChange": [
    {
      "repo": "novabank-api",
      "file": "src/db/customersRepo.ts",
      "lines": [14, 29],
      "reason": "Add anonymiseCustomer(id) (NULL PII fields) and deleteCustomer(id); gated by isEligibleForDeletion from retention/policy.ts",
      "coverage": 76
    },
    {
      "repo": "novabank-api",
      "file": "src/api/routes.ts",
      "lines": [64, 64],
      "reason": "Add DELETE /api/customers/:id — returns 204 on success, 409 when blocked by AML 10-year retention gate",
      "coverage": 97
    },
    {
      "repo": "novabank-api",
      "file": "src/logging/logger.ts",
      "lines": [10, 10],
      "reason": "Remove email and iban from log line — currently logs raw PII on every transfer; already-written logs are a separate remediation",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/customers/index.ts",
      "lines": [1, 1],
      "reason": "Re-export anonymiseCustomer and deleteCustomer from the new functions in customersRepo",
      "coverage": 0
    },
    {
      "repo": "novabank-mobile",
      "file": "src/analytics/events.ts",
      "lines": [9, 37],
      "reason": "BOTH trackTransferInitiated (L9-26) AND trackLimitReached (L28-37) emit raw email+IBAN; both must be masked in the SAME PR — naive single-function fix leaves PII leaking from the second function (proven by simulation)",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "tests/analytics.test.ts",
      "lines": [5, 19],
      "reason": "Tests currently ASSERT that PII is present; must be inverted to assert PII is absent. Must ship in same PR as events.ts fix.",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "src/services/api.ts",
      "lines": [24, 27],
      "reason": "Add deleteAccount(customerId) calling DELETE /api/customers/:id",
      "coverage": 100
    },
    {
      "repo": "novabank-mobile",
      "file": "src/screens/TransferScreen.ts",
      "lines": [1, 21],
      "reason": "Add Delete My Account UI action calling deleteAccount and clearing local state",
      "coverage": 100
    }
  ],
  "filesToCheck": [
    {
      "repo": "novabank-api",
      "file": "src/retention/policy.ts",
      "lines": [1, 9],
      "reason": "BLOCKER — RETENTION_YEARS=10 (COMP-3 AML) directly conflicts with GDPR Art. 17 30-day erasure. Legal must confirm whether anonymisation satisfies both obligations before any code is written.",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/compliance/amlReport.ts",
      "lines": [19, 30],
      "reason": "0% test coverage; external nightly AML scheduler depends on transfers.toIban. Any schema change risks breaking regulatory reporting. Add tests before touching anything nearby.",
      "coverage": 0
    },
    {
      "repo": "novabank-api",
      "file": "src/db/accountsRepo.ts",
      "lines": [5, 15],
      "reason": "Returns raw IBAN in GET /api/accounts/:id. Product/Legal decision: should IBAN be masked on read?",
      "coverage": 97
    },
    {
      "repo": "novabank-api",
      "file": "src/db/transfersRepo.ts",
      "lines": [1, 32],
      "reason": "Transfers table stores toIban. Cannot be deleted without breaking COMP-3/COMP-7 AML retention. Anonymisation strategy must be defined by Legal.",
      "coverage": 100
    },
    {
      "repo": "novabank-api",
      "file": "src/notifications/templates.ts",
      "lines": [2, 3],
      "reason": "0% coverage; embeds toIban in transferConfirmed message. Unknown whether downstream notification queue persists these messages as a secondary PII store.",
      "coverage": 0
    }
  ],
  "filesNotAffected": [
    {
      "repo": "novabank-api",
      "file": "src/fraud/rules.ts",
      "reason": "Fraud thresholds only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/transfers/limits.ts",
      "reason": "Transfer limit constants only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/cards/cardLimits.ts",
      "reason": "Card limit constants only — no PII"
    },
    {
      "repo": "novabank-api",
      "file": "src/db/db.ts",
      "reason": "Raw query abstraction — no PII logic"
    },
    {
      "repo": "novabank-mobile",
      "file": "src/transfers/validateTransfer.ts",
      "reason": "Client-side amount validation only — no PII"
    }
  ],
  "contradictions": [
    {
      "description": "GDPR Art. 17 (erasure within 30 days) vs. COMP-3 AML retention (RETENTION_YEARS=10, src/retention/policy.ts:3, commit c9ba91fd by Bob Chen 2024-06-10). A customer with transfers in the last 10 years cannot be fully deleted without violating AML law.",
      "owner": "Legal / Compliance",
      "severity": "BLOCKER"
    },
    {
      "description": "Raw PII emitted to external analytics (src/analytics/events.ts — both trackTransferInitiated L19-20 and trackLimitReached L35). Deleting the DB row does NOT erase analytics records. Analytics provider must implement a purge API.",
      "owner": "Product / Data-team",
      "severity": "HIGH"
    },
    {
      "description": "Raw PII (email + IBAN) written to application logs on every transfer (src/logging/logger.ts:10, commit 649c8074 by Alice Martin 2024-04-05). DB deletion does NOT scrub already-written log lines.",
      "owner": "Infra / Legal",
      "severity": "HIGH"
    }
  ],
  "openQuestions": [
    "Does anonymisation (NULLing email/phone/IBAN, keeping financial records) satisfy both GDPR Art. 17 AND COMP-3 AML retention simultaneously? Legal must confirm before coding.",
    "What is the log retention period, and can already-written log lines containing PII be scrubbed retroactively?",
    "Should IBAN be masked on GET /api/accounts/:id reads (src/db/accountsRepo.ts:12)? Product decision.",
    "Which team owns the analytics purge API? Can historical analytics records be deleted?",
    "Where is phone number stored in the mobile app — backend profile only, or also native storage?",
    "Does the notification queue system persist IBAN-containing messages (src/notifications/templates.ts:2)?",
    "Unknown external consumers of novabank-api — verify with other teams whether additional services cache PII."
  ],
  "simulationResults": [
    {
      "input": "trackTransferInitiated: email removed (naive fix — only trackTransferInitiated patched)",
      "before": "FAIL — email='user@example.com' present",
      "after": "PASS"
    },
    {
      "input": "trackTransferInitiated: IBAN removed (naive fix)",
      "before": "FAIL — iban='FR763…' present",
      "after": "PASS"
    },
    {
      "input": "trackLimitReached STILL emits raw email after naive patch",
      "before": "FAIL",
      "after": "FAIL — email still present; naive fix is incomplete"
    },
    {
      "input": "trackLimitReached STILL emits raw IBAN after naive patch",
      "before": "FAIL",
      "after": "FAIL — iban still present; both functions must be patched in same PR"
    }
  ],
  "riskLevel": "HIGH",
  "effortDays": 3,
  "changePlan": [
    "GATE: Obtain Legal sign-off that anonymisation satisfies GDPR Art. 17 AND COMP-3 AML retention before merging any code.",
    "SAFE-NOW (independent): Remove email and iban from logTransferEvent in src/logging/logger.ts:10; coordinate with Infra on log scrubbing for already-written records.",
    "Add anonymiseCustomer(id) and deleteCustomer(id) to src/db/customersRepo.ts, gated by isEligibleForDeletion.",
    "Add DELETE /api/customers/:id to src/api/routes.ts — 204 on success, 409 when AML retention blocks.",
    "Update src/customers/index.ts to re-export the two new functions.",
    "Write tests: 204 success, 409 within retention window, PII absent after anonymisation, AML unaffected.",
    "SAME PR — Fix BOTH trackTransferInitiated AND trackLimitReached in src/analytics/events.ts (proven by simulation that fixing only one leaves PII leaking).",
    "SAME PR — Invert assertions in tests/analytics.test.ts to assert PII is absent.",
    "Add deleteAccount(customerId) to src/services/api.ts.",
    "Add Delete My Account UI to src/screens/TransferScreen.ts.",
    "Contact analytics provider: request historical PII purge API.",
    "Investigate phone number in mobile native storage; include in deletion scope if found.",
    "Add test coverage to src/compliance/amlReport.ts before any nearby schema changes (currently 0%).",
    "Audit notification queue for persisted IBAN-containing messages (src/notifications/templates.ts).",
    "Notify other teams: unknown external consumers may cache PII from novabank-api."
  ]
}

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/DESIGN.md

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/DESIGN.md

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/DESIGN.md

### 🤖 Assistant

> 🔧 called: mcp__rulescope__save_impact_report

Now I have the exact schema. Let me build the properly structured report:

> 🔧 **mcp__rulescope__save_impact_report** — {
  "$schema": "https://rulescope/impact-report/v1",
  "ticketId": "LEGAL-31",
  "title": "GDPR Right to Erasure — delete all personal data (email, phone, IBAN) within 30 days",
  "createdAt": "2026-09-26T19:36:26.709+02:00",
  "requestSummary": "On customer request, all personal data (email, phone, IBAN) must be deleted within 30 days across all NovaBank systems including the mobile app. Currently no erasure path exists. PII is also leaked to application logs and an external analytics endpoint, creating secondary data stores that DB deletion alone cannot clear. A hard conflict exists between GDPR Art. 17 (30-day erasure) and COMP-3 AML retention (10-year transaction history).",
  "openQuestions": [
    "Does anonymisation (NULLing email/phone/IBAN while keeping financial records) satisfy both GDPR Art. 17 AND COMP-3 AML retention simultaneously? Legal must confirm before coding.",
    "What is the log retention period, and can already-written log lines containing PII be scrubbed retroactively?",
    "Should IBAN be masked on GET /api/accounts/:id reads (src/db/accountsRepo.ts:12)? Product decision.",
    "Which team owns the analytics purge API? Can historical analytics records be deleted for a given user?",
    "Where is phone number stored in the mobile app — backend profile only, or also native storage (AsyncStorage, SQLite, SecureStore)?",
    "Does the notification queue system persist IBAN-containing messages (src/notifications/templates.ts:2)? Who owns that system?",
    "Unknown external consumers of novabank-api — verify with other teams whether additional services cache PII."
  ],
  "entryPoints": [
    {
      "id": "entry_point:api-routes-delete",
      "kind": "entry_point",
      "label": "Missing DELETE /api/customers/:id route",
      "description": "No HTTP route exists to trigger customer erasure. The router in routes.ts only handles POST /api/transfers, GET /api/limits, and GET /api/accounts/:id. This endpoint is the mandatory entry point for the GDPR erasure request.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/api/routes.ts", "line": 30, "snippet": "export function router(req: RouteRequest): Promise<RouteResponse>", "tool": "git_grep" },
        { "file": "src/api/routes.ts", "line": 42, "snippet": "addRoute(\"POST\", \"/api/transfers\", ...", "tool": "git_grep" },
        { "file": "src/api/routes.ts", "line": 54, "snippet": "addRoute(\"GET\", \"/api/limits\", ...", "tool": "git_grep" },
        { "file": "src/api/routes.ts", "line": 59, "snippet": "addRoute(\"GET\", \"/api/accounts/:id\", ...", "tool": "git_grep" }
      ]
    },
    {
      "id": "entry_point:customers-repo-no-delete",
      "kind": "entry_point",
      "label": "Customer data layer — no anonymise or delete function",
      "description": "src/db/customersRepo.ts stores email, phone, IBAN. Only getCustomer() and upsertCustomer() exist. No anonymiseCustomer() or deleteCustomer() function exists.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/db/customersRepo.ts", "line": 8, "snippet": "  email: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 9, "snippet": "  phone: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 10, "snippet": "  iban: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 14, "snippet": "export function getCustomer(id: string): CustomerRow | undefined {", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 22, "snippet": "export function upsertCustomer(c: CustomerRow): void {", "tool": "git_grep" }
      ]
    },
    {
      "id": "entry_point:analytics-pii-emission",
      "kind": "entry_point",
      "label": "Analytics events emit raw email and IBAN (two emission sites)",
      "description": "Both trackTransferInitiated (L9-26) and trackLimitReached (L28-37) send raw email and IBAN to an external analytics endpoint on every transfer. These are secondary PII stores outside the database that cannot be erased by DB deletion alone.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "src/analytics/events.ts", "line": 8, "snippet": "// Sends user identity including email and IBAN in analytics events", "tool": "git_grep" },
        { "file": "src/analytics/events.ts", "line": 19, "snippet": "      email,", "tool": "git_grep" },
        { "file": "src/analytics/events.ts", "line": 20, "snippet": "      iban,", "tool": "git_grep" },
        { "file": "src/analytics/events.ts", "line": 35, "snippet": "    properties: { userId, email, iban },", "tool": "git_grep" }
      ],
      "issues": [
        {
          "kind": "duplicate",
          "description": "Naive fix of only trackTransferInitiated leaves trackLimitReached (L28-37) still emitting raw PII. Simulation proves both functions must be patched in the same PR.",
          "evidence": [
            { "file": "src/analytics/events.ts", "line": 28, "snippet": "export function trackLimitReached(", "tool": "vitest" },
            { "file": "src/analytics/events.ts", "line": 35, "snippet": "    properties: { userId, email, iban },", "tool": "vitest" }
          ]
        }
      ]
    },
    {
      "id": "entry_point:mobile-api-no-delete",
      "kind": "entry_point",
      "label": "Mobile API client — no deleteAccount function",
      "description": "src/services/api.ts has postTransfer, getLimits, and getAccount but no deleteAccount(customerId) function to call the future DELETE /api/customers/:id endpoint.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "src/services/api.ts", "line": 10, "snippet": "export async function postTransfer(payload: TransferPayload): Promise<unknown> {", "tool": "git_grep" },
        { "file": "src/services/api.ts", "line": 19, "snippet": "export async function getLimits(): Promise<{ dailyLimit: number }> {", "tool": "git_grep" },
        { "file": "src/services/api.ts", "line": 24, "snippet": "export async function getAccount(id: string): Promise<unknown> {", "tool": "git_grep" }
      ]
    }
  ],
  "repoPaths": [
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
  ],
  "filesToChange": {
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api": [
      "src/db/customersRepo.ts",
      "src/api/routes.ts",
      "src/logging/logger.ts",
      "src/customers/index.ts"
    ],
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile": [
      "src/analytics/events.ts",
      "tests/analytics.test.ts",
      "src/services/api.ts",
      "src/screens/TransferScreen.ts"
    ]
  },
  "filesToCheck": {
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api": [
      "src/retention/policy.ts",
      "src/compliance/amlReport.ts",
      "src/db/accountsRepo.ts",
      "src/db/transfersRepo.ts",
      "src/notifications/templates.ts"
    ],
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile": []
  },
  "filesNotAffected": {
    "C:/Users/lisak/rulescope/demo-workspace/novabank-api": [
      "src/fraud/rules.ts",
      "src/transfers/limits.ts",
      "src/cards/cardLimits.ts",
      "src/db/db.ts"
    ],
    "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile": [
      "src/transfers/validateTransfer.ts"
    ]
  },
  "items": [
    {
      "id": "business_rule:aml-retention-conflict",
      "kind": "business_rule",
      "label": "BLOCKER — GDPR Art. 17 vs. COMP-3 AML 10-year retention",
      "description": "RETENTION_YEARS=10 in retention/policy.ts (COMP-3 AML obligation, commit c9ba91fd, Bob Chen 2024-06-10) directly contradicts the GDPR 30-day erasure requirement. A customer with transfers in the last 10 years cannot be fully deleted without violating AML law. Legal must confirm whether anonymisation (NULLing PII fields, keeping financial records) satisfies both obligations.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evaluationOrder": 1,
      "evidence": [
        { "file": "src/retention/policy.ts", "line": 2, "snippet": "// keep transaction history for 10 years - AML obligation COMP-3", "tool": "git_blame" },
        { "file": "src/retention/policy.ts", "line": 3, "snippet": "export const RETENTION_YEARS = 10;", "tool": "git_blame" },
        { "file": "src/retention/policy.ts", "line": 5, "snippet": "export function isEligibleForDeletion(createdAt: Date): boolean {", "tool": "git_blame" }
      ],
      "issues": [
        {
          "kind": "contradiction",
          "description": "GDPR requires erasure within 30 days; COMP-3 requires retention for 10 years. These are mutually exclusive for any customer with a transaction in the last 10 years.",
          "evidence": [
            { "file": "src/retention/policy.ts", "line": 3, "snippet": "export const RETENTION_YEARS = 10;", "tool": "git_blame" }
          ]
        }
      ]
    },
    {
      "id": "technical_dependency:customers-repo-pii-storage",
      "kind": "technical_dependency",
      "label": "SQLite customers table stores email, phone, IBAN — no delete/anonymise function",
      "description": "customersRepo.ts maps all three PII fields. No erasure function exists. Must add anonymiseCustomer(id) that NULLs email/phone/iban fields, gated by isEligibleForDeletion().",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evaluationOrder": 2,
      "evidence": [
        { "file": "src/db/customersRepo.ts", "line": 8, "snippet": "  email: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 9, "snippet": "  phone: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 10, "snippet": "  iban: string;", "tool": "git_grep" },
        { "file": "src/db/customersRepo.ts", "line": 16, "snippet": "\"SELECT id, name, email, phone, iban, tier FROM customers WHERE id = ?\"", "tool": "git_blame" }
      ]
    },
    {
      "id": "entry_point:logger-pii-leak",
      "kind": "entry_point",
      "label": "Logger emits raw email and IBAN on every transfer",
      "description": "logTransferEvent() in logger.ts writes email and iban to stdout on every transfer (commit 649c8074, Alice Martin 2024-04-05). DB deletion does not scrub already-written log lines. This is a secondary PII store in the log system.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/logging/logger.ts", "line": 3, "snippet": "// Logs customer PII on every transfer event", "tool": "git_blame" },
        { "file": "src/logging/logger.ts", "line": 10, "snippet": "`[TRANSFER] customerId=${customer.id} email=${customer.email} iban=${customer.iban} amount=${amount} status=${status}`", "tool": "git_blame" }
      ],
      "issues": [
        {
          "kind": "hidden_usage",
          "description": "Already-written log lines persist PII even after DB row deletion. Log retention/redaction policy required from Infra/Legal.",
          "evidence": [
            { "file": "src/logging/logger.ts", "line": 10, "snippet": "email=${customer.email} iban=${customer.iban}", "tool": "git_blame" }
          ]
        }
      ]
    },
    {
      "id": "entry_point:analytics-pii-leak",
      "kind": "entry_point",
      "label": "Analytics: raw email+IBAN sent externally in TWO functions",
      "description": "Both trackTransferInitiated (L19-20) and trackLimitReached (L35) in analytics/events.ts send raw email and IBAN to an external analytics system. Commit 9296eb2, David Kim 2023-10-02. Naive fix of only one function leaves the other still leaking PII (simulation-proven).",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "src/analytics/events.ts", "line": 19, "snippet": "      email,", "tool": "git_blame" },
        { "file": "src/analytics/events.ts", "line": 20, "snippet": "      iban,", "tool": "git_blame" },
        { "file": "src/analytics/events.ts", "line": 35, "snippet": "    properties: { userId, email, iban },", "tool": "git_blame" }
      ],
      "issues": [
        {
          "kind": "duplicate",
          "description": "Two emission sites. Simulation shows naive patch of trackTransferInitiated alone leaves trackLimitReached emitting PII. Both must be fixed in the same PR.",
          "evidence": [
            { "file": "src/analytics/events.ts", "line": 28, "snippet": "export function trackLimitReached(", "tool": "vitest" },
            { "file": "src/analytics/events.ts", "line": 35, "snippet": "    properties: { userId, email, iban },", "tool": "vitest" }
          ]
        },
        {
          "kind": "unknown_external_consumer",
          "description": "Analytics records are stored in an external analytics system outside these repositories. Deleting the DB customer row does NOT erase analytics history. Analytics provider must be contacted to implement a PII purge API.",
          "evidence": [
            { "file": "src/analytics/events.ts", "line": 24, "snippet": "// In production this calls the analytics endpoint", "tool": "git_grep" }
          ]
        }
      ]
    },
    {
      "id": "test:analytics-tests-assert-pii-present",
      "kind": "test",
      "label": "Analytics tests assert PII IS present — must be inverted",
      "description": "tests/analytics.test.ts L8-9 and L16-17 assert that email and IBAN ARE present in event properties. After the fix these tests will fail correctly (they encode the wrong behavior). Must be inverted in the same PR as the events.ts fix.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "evidence": [
        { "file": "tests/analytics.test.ts", "line": 5, "snippet": "it(\"includes email and IBAN in event properties\", () => {", "tool": "git_grep" },
        { "file": "tests/analytics.test.ts", "line": 8, "snippet": "    expect(ev.properties.email).toBe(\"user@example.com\");", "tool": "git_grep" },
        { "file": "tests/analytics.test.ts", "line": 9, "snippet": "    expect(ev.properties.iban).toBe(\"FR7630006000011234567890189\");", "tool": "git_grep" },
        { "file": "tests/analytics.test.ts", "line": 16, "snippet": "    expect(ev.properties.email).toBe(\"user@example.com\");", "tool": "git_grep" },
        { "file": "tests/analytics.test.ts", "line": 17, "snippet": "    expect(ev.properties.iban).toBe(\"FR7630006000011234567890189\");", "tool": "git_grep" }
      ]
    },
    {
      "id": "technical_dependency:aml-report-zero-coverage",
      "kind": "technical_dependency",
      "label": "AML nightly report — 0% coverage, external scheduler dependency",
      "description": "src/compliance/amlReport.ts has 0% test coverage and is called by an external nightly AML scheduler (COMP-7). It reads toIban from the transfers table. Any schema change to transfers risks breaking regulatory reporting silently.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/compliance/amlReport.ts", "line": 1, "snippet": "// AML nightly report - regulatory requirement COMP-7", "tool": "git_grep" },
        { "file": "src/compliance/amlReport.ts", "line": 22, "snippet": "SELECT fromAccountId, toIban, amount, createdAt FROM transfers", "tool": "git_grep" }
      ],
      "issues": [
        {
          "kind": "unknown_external_consumer",
          "description": "External nightly AML scheduler calls this function. Its scheduler is outside these repositories — verify with the AML team before touching the transfers schema.",
          "evidence": [
            { "file": "src/compliance/amlReport.ts", "line": 1, "snippet": "// AML nightly report - regulatory requirement COMP-7", "tool": "git_grep" }
          ]
        }
      ]
    },
    {
      "id": "technical_dependency:notifications-iban-in-messages",
      "kind": "technical_dependency",
      "label": "Notification templates embed raw IBAN in message text",
      "description": "src/notifications/templates.ts:2 embeds toIban directly in the transferConfirmed message string. 0% coverage. If downstream notification queues persist these messages, they form a secondary PII store outside this repo.",
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "evidence": [
        { "file": "src/notifications/templates.ts", "line": 2, "snippet": "  transferConfirmed: (amount: number, toIban: string) =>", "tool": "git_grep" },
        { "file": "src/notifications/templates.ts", "line": 3, "snippet": "`Your transfer of €${amount} to ${toIban} has been confirmed.`", "tool": "git_grep" }
      ],
      "issues": [
        {
          "kind": "unknown_external_consumer",
          "description": "Unknown whether notification delivery system persists message bodies. If so, IBAN appears in a secondary data store that DB deletion cannot clear.",
          "evidence": [
            { "file": "src/notifications/templates.ts", "line": 3, "snippet": "`Your transfer of €${amount} to ${toIban} has been confirmed.`", "tool": "git_grep" }
          ]
        }
      ]
    }
  ],
  "simulations": [
    {
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "edits": [],
      "testCode": "import { trackTransferInitiated, trackLimitReached } from './src/analytics/events.js'; describe('before fix', () => { it('trackTransferInitiated MUST NOT emit email', () => { const ev = trackTransferInitiated('u1','user@example.com','FR763…',200); expect(ev.properties.email).toBeUndefined(); }); });",
      "rows": [
        { "input": "trackTransferInitiated: email must not be emitted (BEFORE any fix)", "before": "FAIL — email='user@example.com' present", "after": "FAIL — email='user@example.com' present", "passed": false },
        { "input": "trackLimitReached: email must not be emitted (BEFORE any fix)", "before": "FAIL — email='user@example.com' present", "after": "FAIL — email='user@example.com' present", "passed": false },
        { "input": "trackTransferInitiated: IBAN must not be emitted (BEFORE any fix)", "before": "FAIL — iban='FR7630006000011234567890189' present", "after": "FAIL — iban present", "passed": false },
        { "input": "trackLimitReached: IBAN must not be emitted (BEFORE any fix)", "before": "FAIL — iban present", "after": "FAIL — iban present", "passed": false }
      ],
      "rawOutput": "All four GDPR PII assertions fail — current code emits raw email and IBAN in both functions.",
      "worktreePath": "(temporary worktree — cleaned up)"
    },
    {
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "edits": [
        {
          "file": "src/analytics/events.ts",
          "search": "    properties: {\n      userId,\n      email,\n      iban,\n      amount,\n    },",
          "replace": "    properties: {\n      userId,\n      amount,\n    },"
        }
      ],
      "testCode": "Naive fix: only trackTransferInitiated patched. Tests for trackLimitReached.",
      "rows": [
        { "input": "trackTransferInitiated: email removed (naive fix)", "before": "FAIL — email present", "after": "PASS", "passed": true },
        { "input": "trackTransferInitiated: IBAN removed (naive fix)", "before": "FAIL — IBAN present", "after": "PASS", "passed": true },
        { "input": "trackLimitReached STILL emits raw email after naive patch", "before": "FAIL", "after": "FAIL — email still present", "passed": false },
        { "input": "trackLimitReached STILL emits raw IBAN after naive patch", "before": "FAIL", "after": "FAIL — IBAN still present", "passed": false }
      ],
      "rawOutput": "Naive single-function fix is incomplete: trackLimitReached (L28-37) still emits raw email and IBAN. Both functions must be patched in the same PR.",
      "worktreePath": "(temporary worktree — cleaned up)"
    }
  ],
  "coverage": [
    {
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api",
      "fileCoverage": {
        "src/api/routes.ts": 97,
        "src/compliance/amlReport.ts": 0,
        "src/customers/index.ts": 0,
        "src/db/customersRepo.ts": 76,
        "src/db/transfersRepo.ts": 100,
        "src/logging/logger.ts": 100,
        "src/notifications/templates.ts": 0,
        "src/retention/policy.ts": 100
      },
      "functionCoverage": {
        "src/api/routes.ts:addRoute": 100,
        "src/api/routes.ts:router": 100,
        "src/compliance/amlReport.ts:getAmlCandidates": 0,
        "src/customers/index.ts:(empty-report)": 0,
        "src/db/customersRepo.ts:getCustomer": 100,
        "src/db/customersRepo.ts:upsertCustomer": 0,
        "src/logging/logger.ts:logTransferEvent": 100,
        "src/notifications/templates.ts:(empty-report)": 0,
        "src/retention/policy.ts:isEligibleForDeletion": 100
      },
      "uncoveredFiles": [
        "src/customers/index.ts",
        "src/compliance/amlReport.ts",
        "src/notifications/templates.ts"
      ]
    },
    {
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile",
      "fileCoverage": {
        "src/analytics/events.ts": 100,
        "src/screens/TransferScreen.ts": 100,
        "src/services/api.ts": 100,
        "src/transfers/validateTransfer.ts": 88
      },
      "functionCoverage": {
        "src/analytics/events.ts:trackTransferInitiated": 100,
        "src/analytics/events.ts:trackLimitReached": 100,
        "src/screens/TransferScreen.ts:submitTransfer": 100,
        "src/services/api.ts:postTransfer": 100,
        "src/services/api.ts:getLimits": 100,
        "src/services/api.ts:getAccount": 100,
        "src/transfers/validateTransfer.ts:validateTransfer": 100
      },
      "uncoveredFiles": []
    }
  ],
  "riskLevel": "high",
  "effortEstimate": "8 files across 2 repos, ~80–100 lines changed; plus external coordination with analytics provider, AML team, Legal, and Infra",
  "riskRationale": "No erasure path exists — compliance gap is total. Hard regulatory conflict (GDPR vs. AML) blocks full deletion. Two independent PII leaks (logs, analytics) require external remediation beyond these repos. Analytics has a hidden duplicate emission site that a naive fix misses (simulation-proven). AML report has 0% test coverage near a schema change zone.",
  "changePlan": [
    {
      "order": 1,
      "action": "GATE — Obtain Legal written sign-off that anonymisation (NULLing email/phone/iban, retaining financial records) satisfies both GDPR Art. 17 and COMP-3 AML retention obligation.",
      "rationale": "Without this decision, any erasure implementation may violate AML law. All subsequent DB-touching steps depend on this answer.",
      "targetFiles": ["src/retention/policy.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 2,
      "action": "Remove email and iban from the logTransferEvent() log line in src/logging/logger.ts:10; log only customerId. Separately, coordinate with Infra on log scrubbing policy for already-written records.",
      "rationale": "This is safe and independent of the AML gate. It stops future PII accumulation in logs immediately.",
      "targetFiles": ["src/logging/logger.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 3,
      "action": "Add anonymiseCustomer(id: string): void to src/db/customersRepo.ts — sets email, phone, iban to NULL for the given customer. Gate: check isEligibleForDeletion before NULLing; return a status indicating whether erasure was blocked.",
      "rationale": "This is the core DB-layer erasure function, prerequisite for the API endpoint.",
      "targetFiles": ["src/db/customersRepo.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 4,
      "action": "Add DELETE /api/customers/:id to src/api/routes.ts: calls anonymiseCustomer, returns 204 on success, 409 with reason when AML retention gate blocks erasure.",
      "rationale": "Provides the HTTP entry point required by GDPR Art. 17 for user-initiated erasure requests.",
      "targetFiles": ["src/api/routes.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 5,
      "action": "Update src/customers/index.ts to re-export anonymiseCustomer (and deleteCustomer if full deletion is permitted by Legal).",
      "rationale": "The public customer module facade must expose the new functions.",
      "targetFiles": ["src/customers/index.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 6,
      "action": "Write vitest tests for the new erasure endpoint: 204 success path, 409 within AML retention window, PII fields absent after anonymisation, existing transfer tests unaffected, AML report query unaffected.",
      "rationale": "Ensures the erasure path is regression-tested and the AML gate cannot be bypassed.",
      "targetFiles": ["tests/routes.test.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 7,
      "action": "In the SAME PR: fix BOTH trackTransferInitiated AND trackLimitReached in src/analytics/events.ts to remove email and iban from event properties. Do NOT fix only one — simulation proves the other keeps emitting PII.",
      "rationale": "Two independent emission sites — single-function fix is insufficient. Simulation result is conclusive.",
      "targetFiles": ["src/analytics/events.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 8,
      "action": "In the SAME PR as step 7: invert all assertions in tests/analytics.test.ts from 'PII is present' to 'PII is absent'.",
      "rationale": "Current tests encode the wrong behaviour and will fail correctly after the fix. Ship test and code together.",
      "targetFiles": ["tests/analytics.test.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 9,
      "action": "Add deleteAccount(customerId: string): Promise<void> to src/services/api.ts calling DELETE /api/customers/:id.",
      "rationale": "Mobile app needs an API client function to trigger erasure from the UI.",
      "targetFiles": ["src/services/api.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 10,
      "action": "Add a 'Delete My Account' action to src/screens/TransferScreen.ts (or a dedicated AccountScreen) that calls deleteAccount() and clears local application state.",
      "rationale": "GDPR Art. 17 requires a user-accessible mechanism to exercise the right to erasure.",
      "targetFiles": ["src/screens/TransferScreen.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 11,
      "action": "Contact analytics provider: request a historical PII purge API for a given userId, confirm deletion SLA, and document the process for handling incoming GDPR erasure requests.",
      "rationale": "Analytics records are a secondary PII store outside these repos; DB deletion does not cover them.",
      "targetFiles": [],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 12,
      "action": "Investigate phone number storage in the mobile native layer (AsyncStorage, SQLite, SecureStore, Keychain) and include any native stores in the deletion scope.",
      "rationale": "The ticket requires phone deletion; phone is absent from all JS source in novabank-mobile, suggesting it may be in native code or backend-only.",
      "targetFiles": [],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-mobile"
    },
    {
      "order": 13,
      "action": "Add test coverage to src/compliance/amlReport.ts (currently 0%) before making any schema changes to the transfers table.",
      "rationale": "External nightly AML scheduler depends on toIban in transfers; 0% coverage means schema changes fail silently.",
      "targetFiles": ["src/compliance/amlReport.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 14,
      "action": "Audit notification delivery system: confirm whether IBAN-containing notification messages in src/notifications/templates.ts:2-3 are persisted by the queue, and remediate if confirmed.",
      "rationale": "Persisted notification bodies are a secondary IBAN store that DB deletion cannot clear.",
      "targetFiles": ["src/notifications/templates.ts"],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    },
    {
      "order": 15,
      "action": "Notify other teams: unknown external consumers may be caching PII from novabank-api responses (e.g. GET /api/accounts/:id returns raw IBAN). Request inventory of all downstream API consumers.",
      "rationale": "Unknown external consumers are an open risk that cannot be resolved from within these repositories.",
      "targetFiles": [],
      "repoPath": "C:/Users/lisak/rulescope/demo-workspace/novabank-api"
    }
  ]
}

### 🤖 Assistant

> 🔧 called: update_todo_list

Report saved. Now let me present the full Impact Brief:

> 🔧 **update_todo_list** — 
[x] Read and decode PDF ticket T2-gdpr-deletion.pdf
[x] Step 2: Map repositories with find_cross_repo_links
[x] Step 3: Analyze both repositories in parallel (subagents)
[x] Step 4: Merge results and verify key files
[x] Step 5: Simulate change (before/after)
[x] Step 6: Save and present Impact Brief


### 🤖 Assistant

---

# Impact Brief — LEGAL-31: GDPR Right to Erasure

**Ticket:** NovaBank Legal Department — Request LEGAL-31  
**Request:** On customer request, all personal data (email, phone number, IBAN) must be deleted within 30 days. Applies to all NovaBank systems including the mobile application.  
**Report saved:** [`report/data/LEGAL-31.json`](report/data/LEGAL-31.json)

---

## ⛔ BLOCKER — Must resolve before any code is merged

| Conflict | File | Evidence |
|---|---|---|
| **GDPR Art. 17 (30-day erasure) vs. COMP-3 AML (10-year retention)** | [`src/retention/policy.ts:3`](demo-workspace/novabank-api/src/retention/policy.ts:3) | `RETENTION_YEARS = 10` — added by Bob Chen, 2024-06-10, commit `c9ba91fd` |

Any customer with a transfer in the last 10 years **cannot be fully deleted** without violating AML law. **Legal must confirm in writing** whether anonymisation (NULLing PII fields while keeping financial records) satisfies both obligations before a single line is merged.

---

## 🗂 Entry Points

### novabank-api
| What | File | Status |
|---|---|---|
| HTTP router | [`src/api/routes.ts:30`](demo-workspace/novabank-api/src/api/routes.ts:30) | ❌ No `DELETE /api/customers/:id` route exists |
| Customer data layer | [`src/db/customersRepo.ts:14`](demo-workspace/novabank-api/src/db/customersRepo.ts:14) | ❌ Only `getCustomer` + `upsertCustomer` — no delete/anonymise |
| Logger | [`src/logging/logger.ts:10`](demo-workspace/novabank-api/src/logging/logger.ts:10) | ❌ Emits raw `email` + `iban` on every transfer |

### novabank-mobile
| What | File | Status |
|---|---|---|
| Analytics events | [`src/analytics/events.ts:9`](demo-workspace/novabank-mobile/src/analytics/events.ts:9) | ❌ Raw email+IBAN sent externally on every transfer — **2 emission sites** |
| API client | [`src/services/api.ts:24`](demo-workspace/novabank-mobile/src/services/api.ts:24) | ❌ No `deleteAccount()` function |
| UI screen | [`src/screens/TransferScreen.ts`](demo-workspace/novabank-mobile/src/screens/TransferScreen.ts) | ❌ No "Delete My Account" action |

---

## 📝 Files to CHANGE

### novabank-api (4 files)
| File | Change needed | Coverage |
|---|---|---|
| [`src/db/customersRepo.ts`](demo-workspace/novabank-api/src/db/customersRepo.ts) | Add `anonymiseCustomer(id)` — NULLs email/phone/iban, gated by `isEligibleForDeletion()` | 76% |
| [`src/api/routes.ts`](demo-workspace/novabank-api/src/api/routes.ts) | Add `DELETE /api/customers/:id` — 204 on success, 409 when AML gate blocks | 97% |
| [`src/logging/logger.ts:10`](demo-workspace/novabank-api/src/logging/logger.ts:10) | Remove `email` and `iban` from log line; log only `customerId` | 100% |
| [`src/customers/index.ts`](demo-workspace/novabank-api/src/customers/index.ts) | Re-export `anonymiseCustomer` (and `deleteCustomer` if Legal permits) | 0% |

### novabank-mobile (4 files)
| File | Change needed | Coverage |
|---|---|---|
| [`src/analytics/events.ts`](demo-workspace/novabank-mobile/src/analytics/events.ts) | Fix **both** `trackTransferInitiated` (L19-20) **and** `trackLimitReached` (L35) — **same PR** | 100% |
| [`tests/analytics.test.ts`](demo-workspace/novabank-mobile/tests/analytics.test.ts) | Invert assertions: PII must be **absent**, not present — **same PR** as events.ts | 100% |
| [`src/services/api.ts`](demo-workspace/novabank-mobile/src/services/api.ts) | Add `deleteAccount(customerId)` calling `DELETE /api/customers/:id` | 100% |
| [`src/screens/TransferScreen.ts`](demo-workspace/novabank-mobile/src/screens/TransferScreen.ts) | Add "Delete My Account" UI action | 100% |

---

## 🔎 Files to CHECK

| File | Concern | Coverage |
|---|---|---|
| [`src/retention/policy.ts:3`](demo-workspace/novabank-api/src/retention/policy.ts:3) | **BLOCKER** — `RETENTION_YEARS = 10` hard-conflicts with GDPR | 100% |
| [`src/compliance/amlReport.ts`](demo-workspace/novabank-api/src/compliance/amlReport.ts) | 0% coverage; external nightly AML scheduler reads `toIban` from transfers — add tests before any schema touch | **0%** |
| [`src/db/accountsRepo.ts`](demo-workspace/novabank-api/src/db/accountsRepo.ts) | `GET /api/accounts/:id` returns raw IBAN — should it be masked? (Product decision) | 97% |
| [`src/db/transfersRepo.ts`](demo-workspace/novabank-api/src/db/transfersRepo.ts) | Stores `toIban`; cannot delete without breaking COMP-3/COMP-7 | 100% |
| [`src/notifications/templates.ts:2`](demo-workspace/novabank-api/src/notifications/templates.ts:2) | Embeds raw IBAN in message text; 0% coverage; unknown whether notification queue persists it | **0%** |

---

## ✅ Files NOT Affected

**novabank-api:** [`src/fraud/rules.ts`](demo-workspace/novabank-api/src/fraud/rules.ts), [`src/transfers/limits.ts`](demo-workspace/novabank-api/src/transfers/limits.ts), [`src/cards/cardLimits.ts`](demo-workspace/novabank-api/src/cards/cardLimits.ts), [`src/db/db.ts`](demo-workspace/novabank-api/src/db/db.ts) — thresholds/abstractions, no PII.  
**novabank-mobile:** [`src/transfers/validateTransfer.ts`](demo-workspace/novabank-mobile/src/transfers/validateTransfer.ts) — client-side amount validation only.

---

## 🧪 Simulation Results

Naive fix: patch only `trackTransferInitiated`, leave `trackLimitReached` untouched.

| Test | Before | After naive fix |
|---|---|---|
| `trackTransferInitiated`: email removed | ❌ `email='user@example.com'` present | ✅ PASS |
| `trackTransferInitiated`: IBAN removed | ❌ IBAN present | ✅ PASS |
| `trackLimitReached`: email removed | ❌ email present | ❌ **email still present** |
| `trackLimitReached`: IBAN removed | ❌ IBAN present | ❌ **IBAN still present** |

**→ Both functions must be patched in the same PR.** A single-function fix is provably insufficient.

---

## 📚 Git History Notes

| File | Commit | Author | Date | Message |
|---|---|---|---|---|
| [`src/retention/policy.ts`](demo-workspace/novabank-api/src/retention/policy.ts) | `c9ba91fd` | Bob Chen | 2024-06-10 | feat: card limits, notification templates, retention policy |
| [`src/logging/logger.ts`](demo-workspace/novabank-api/src/logging/logger.ts) | `649c8074` | Alice Martin | 2024-04-05 | feat: logging for transfer events |
| [`src/analytics/events.ts`](demo-workspace/novabank-mobile/src/analytics/events.ts) | `9296eb2f` | David Kim | 2023-10-02 | feat: analytics event tracking for transfers |

No privacy review mentioned in any commit message.

---

## 📊 Coverage Gaps

| File | Coverage | Risk |
|---|---|---|
| `src/compliance/amlReport.ts` | **0%** | Schema changes here fail silently |
| `src/notifications/templates.ts` | **0%** | Unknown downstream consumers |
| `src/customers/index.ts` | **0%** | Re-export facade (low risk, must be added) |
| `src/db/customersRepo.ts:upsertCustomer` | **0%** (fn) | New erasure functions also need tests |

---

## ❓ Open Questions

1. **Legal** — Does anonymisation satisfy both GDPR Art. 17 and COMP-3 AML? (**Blocker**)
2. **Infra/Legal** — Log retention period? Can already-written PII log lines be scrubbed retroactively?
3. **Product** — Should IBAN be masked on `GET /api/accounts/:id` reads?
4. **Data team** — Who owns the analytics purge API? Can historical records be deleted per userId?
5. **Mobile team** — Is phone number stored in native mobile storage (AsyncStorage, SecureStore, SQLite), or backend-only?
6. **Infra** — Does the notification queue system persist IBAN-containing message bodies?
7. **All teams** — Unknown external consumers of `novabank-api` may cache PII responses.

---

## 🔴 Risk & Effort

- **Risk: HIGH** — No erasure path exists (compliance gap is total). Hard regulatory conflict blocks full deletion. Two independent PII leaks require external coordination. Hidden duplicate emission site in analytics (simulation-proven). AML report at 0% coverage.
- **Effort: ~3 days** — 8 files across 2 repos (~80-100 lines), plus external coordination with Legal, Infra, analytics provider, and AML team.

---

## 🗺 Safe Change Plan (15 steps)

```
1. GATE  — Legal sign-off: anonymisation satisfies GDPR + COMP-3 (no code merged without this)
2. SAFE  — Remove email/iban from logger.ts:10 (independent, can start now)
3.       — Add anonymiseCustomer(id) to customersRepo.ts, gated by isEligibleForDeletion()
4.       — Add DELETE /api/customers/:id to routes.ts (204 / 409)
5.       — Re-export new functions from customers/index.ts
6.       — Write tests: 204 success, 409 AML gate, PII absent post-anonymisation
7. SAME PR — Fix BOTH trackTransferInitiated AND trackLimitReached in analytics/events.ts
8. SAME PR — Invert analytics.test.ts assertions (PII absent, not present)
9.       — Add deleteAccount() to services/api.ts
10.      — Add Delete My Account UI to TransferScreen.ts
11.      — Contact analytics provider: request historical PII purge API
12.      — Investigate phone in mobile native storage
13.      — Add test coverage to amlReport.ts (0% now) before any schema changes
14.      — Audit notification queue for persisted IBAN messages
15.      — Notify other teams: unknown external API consumers may cache PII
```

---

Ready to apply this plan in Agent mode — say the word when Legal sign-off is in hand.