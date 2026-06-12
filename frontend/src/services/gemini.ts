import api from './api';

export async function callGemini(prompt: string): Promise<string> {
    try {
        const res = await api.post('/ai/gemini', {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        });
        return res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error: any) {
        console.error('[Gemini Backend Proxy]', error);
        throw new Error('Gemini lỗi: ' + (error.response?.data?.error || error.message));
    }
}

// Sinh nhận xét tổng quan báo cáo học tập từ nhật ký buổi học
export async function generateParentReport(params: {
    studentName: string;
    courseTitle: string;
    tutorName: string;
    completedCount: number;
    totalCount: number;
    sessions: { title: string; notes: string; isCompleted: boolean }[];
    extraNote?: string;
}): Promise<string> {
    const sessionDetails = params.sessions
        .filter(s => s.isCompleted && s.notes)
        .map(s => `- ${s.title}: ${s.notes}`)
        .join('\n');

    const prompt = `Bạn là trợ lý giáo dục. Hãy viết một đoạn nhận xét tổng quan về tiến độ học tập của học viên để gửi cho phụ huynh.

Thông tin:
- Học viên: ${params.studentName}
- Khóa học: ${params.courseTitle}
- Gia sư: ${params.tutorName}
- Tiến độ: ${params.completedCount}/${params.totalCount} buổi đã hoàn thành

Nhật ký các buổi đã học:
${sessionDetails || 'Chưa có nhật ký chi tiết'}

${params.extraNote ? `Ghi chú thêm từ gia sư: ${params.extraNote}` : ''}

Yêu cầu:
- Viết bằng tiếng Việt, lịch sự, chuyên nghiệp
- Nhận xét về điểm mạnh và điểm cần cải thiện của học viên dựa trên nhật ký
- Đưa ra lời khuyên cụ thể cho phụ huynh
- Độ dài khoảng 3-4 câu, súc tích
- Chỉ trả về đoạn nhận xét, không thêm tiêu đề hay định dạng khác`;

    return await callGemini(prompt);
}

// Phân tích yêu cầu tìm gia sư từ câu hỏi tự nhiên
export async function analyzeTutorSearch(userQuery: string): Promise<{
    subject?: string;
    grade?: string;
    province?: string;
    teachingMode?: string;
    maxPrice?: number;
    summary: string;
}> {
    const prompt = `Phân tích yêu cầu tìm gia sư sau và trích xuất thông tin. Chỉ trả về JSON thuần túy, không markdown.

Yêu cầu: "${userQuery}"

Trả về JSON với các trường:
{
  "subject": "tên môn học nếu có (Toán/Vật lý/Hóa học/Sinh học/Ngữ văn/Tiếng Anh/Tiếng Trung/Tiếng Nhật/IELTS/TOEIC/Tin học)",
  "grade": "lớp học nếu có (Lớp 1 đến Lớp 12)",
  "province": "tỉnh/thành phố nếu có (TP. Hồ Chí Minh/Hà Nội/...)",
  "teachingMode": "ONLINE hoặc OFFLINE nếu có",
  "maxPrice": số tiền tối đa mỗi buổi nếu có (chỉ số, không đơn vị),
  "summary": "tóm tắt yêu cầu bằng 1 câu tiếng Việt"
}`;

    try {
        const raw = await callGemini(prompt);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return { summary: userQuery };
    }
}