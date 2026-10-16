# AI Financial Health Assistant
**ผู้ช่วย AI ตรวจสุขภาพการเงินและวางแผนการเงินส่วนบุคคล**

โปรเจกต์นี้พัฒนาขึ้นภายใต้หัวข้อโครงงาน "การจัดการชีวิต" โดยอ้างอิงหลักการคำนวณ Money Index 3 ตัวชี้วัด จากหนังสือ *Money Makeover Workbook* ของโค้ชหนุ่ม (จักรพงษ์ เมษพันธุ์)

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
[ HTML Form (Client) ]
   │
   │  1. ส่ง Raw JSON Payload (ไม่มีการคำนวณในหน้าเว็บ)
   ▼
[ n8n Webhook Node ]
   │
   │  2. ส่งต่อข้อมูลเข้า Code Node
   ▼
[ Calculate Money Index (Code Node, JavaScript) ]
   │  - คำนวณรายได้รวม, เงินออมรวม, ภาระหนี้สินรวม, ทรัพย์สินคล่อง และรายจ่าย
   │  - คำนวณ 3 ตัวชี้วัด Money Index (Saving Ratio, Debt Ratio, Emergency Ratio)
   │  - ประเมินสถานะ เกณฑ์ และสีของ Badge ด้วยโค้ด (ไม่ให้ AI เป็นผู้ตัดสิน)
   ▼
[ AI Agent + OpenRouter Chat Model (openai/o4-mini) ] 🤖
   │  - วิเคราะห์จุดแข็ง จุดที่ต้องระวัง
   │  - ออกแบบ Action Plan 3 ขั้นตอนรายบุคคล
   │  - Structured Output Parser บังคับให้ตอบเป็น JSON ตาม Schema
   ▼
[ Combine Result (Edit Fields / Set Node) ]
   │  - รวมผลคำนวณจาก Calculate Money Index กับคำวิเคราะห์จาก AI เป็น JSON เดียว
   │
   │  3. Webhook ตั้งค่า Respond เป็น "When Last Node Finishes"
   │     จึงส่งผลลัพธ์ JSON ของโหนดนี้กลับมายังหน้าเว็บ
   ▼
[ HTML Dashboard ]
      แสดงผลตัวเลข Money Index และคำแนะนำจาก AI
```

---

## 📂 โครงสร้างไฟล์ในโปรเจกต์

| ไฟล์ | รายละเอียด |
| :--- | :--- |
| **`index.html`** | หน้าเว็บแบบฟอร์ม Stepper 4 ขั้นตอน (ทำหน้าที่รับ input ข้อมูลดิบอย่างเดียว ไม่มีการคิดเลขในเว็บ) + หน้าแสดงผล Dashboard |
| **`app.js`** | รวบรวมข้อมูลดิบ (Raw Data) จากฟอร์ม แปลงเป็น JSON แล้วส่ง HTTP POST ยิงตรงไปยัง n8n Webhook และรับผลลัพธ์มา Render บน Dashboard (ข้อความจาก AI ถูก escape ก่อนแสดงผล) |
| **`styles.css`** | ปรับแต่ง UI ด้วยฟอนต์ภาษาไทย (Prompt) และจัดหน้ารองรับการสั่งพิมพ์รายงาน (PDF) |
| **`My ai for everyone workflow.json`** | ไฟล์ Workflow Export สำหรับ Import เข้า n8n (Webhook → Calculate Money Index → AI Agent + Structured Output Parser → Combine Result) โดย Webhook ตอบกลับเมื่อโหนดสุดท้ายทำงานเสร็จ |

### รูปแบบ JSON ที่ Webhook ตอบกลับ

```json
{
  "user_greeting": "สวัสดีคุณ...",
  "overall_status": "...",
  "money_index": {
    "saving":    { "value": "14.38%",  "badge": "ยอดเยี่ยม (≥10%)",      "color": "emerald" },
    "debt":      { "value": "45%",     "badge": "เปราะบาง (41-50%)",     "color": "amber" },
    "emergency": { "value": "14 เดือน", "badge": "ปลอดภัยมาก (≥6 เดือน)", "color": "emerald" }
  },
  "strengths": ["..."],
  "concerns": ["..."],
  "action_plan": [{ "step": 1, "title": "...", "detail": "..." }]
}
```

`user_greeting`, `overall_status` และ `money_index` มาจากโค้ดเสมอ ส่วน `strengths`, `concerns` และ `action_plan` มาจาก AI ผ่าน Structured Output Parser (ถ้า AI ตอบไม่ตรง Schema Workflow จะหยุดและหน้าเว็บแสดงหน้าข้อผิดพลาด)

---

## 🚀 วิธีการใช้งาน

1. **เปิดใช้งาน n8n**:
   - นำเข้าไฟล์ `My ai for everyone workflow.json` เข้าสู่ n8n
   - ตั้งค่า Credential ของ **OpenRouter account** ในโหนด OpenRouter Chat Model   - คัดลอก Webhook URL:
     - **Test URL** (`/webhook-test/financial-health`) ใช้ได้เฉพาะตอนกด "Listen for test event" ใน n8n และรับได้ครั้งละ 1 request
     - **Production URL** (`/webhook/financial-health`) ต้องเปิด Workflow ให้เป็น Active ก่อน
2. **เปิดหน้าเว็บ**:
   - ดับเบิ้ลคลิกไฟล์ `index.html` เพื่อเปิดในเบราว์เซอร์
   - กดปุ่ม **"ตั้งค่า n8n"** มุมขวาบน แล้ววาง Webhook URL จาก n8n ลงไป จากนั้นกดบันทึก
3. **ทดสอบใช้งาน**:
   - กดปุ่ม **"โหลดเคสตัวอย่าง"** หรือกรอกข้อมูลด้วยตนเอง
   - กด **"ถัดไป"** ไปจนถึงขั้นตอนสุดท้าย แล้วกด **"เริ่มประเมินสุขภาพการเงินด้วย AI"**
   - หน้าเว็บจะส่งข้อมูลดิบไปให้ **Code Node ใน n8n** ทำการคำนวณ และนำผลลัพธ์กลับมาแสดงผลบน Dashboard อย่างสมบูรณ์

> ⚠️ ข้อมูลการเงินที่กรอกจะถูกส่งไปยังผู้ให้บริการ AI ผ่าน OpenRouter และคำแนะนำจาก AI เป็นเพียงข้อมูลประกอบเพื่อการศึกษา ไม่ใช่คำแนะนำทางการเงินจากผู้เชี่ยวชาญ
