package com.thanh.ketnoigiasubackend.service;

import com.lowagie.text.DocumentException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    public byte[] generateContractPdf(String htmlContent) {
        // Wrap nội dung vào XHTML đầy đủ với font hỗ trợ tiếng Việt
        String xhtml = buildXhtml(htmlContent);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(xhtml);
            renderer.layout();
            renderer.createPDF(baos);
            return baos.toByteArray();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Không thể tạo file PDF: " + e.getMessage(), e);
        }
    }

    private String buildXhtml(String body) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
                    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
                    <style type="text/css">
                        @page { margin: 2cm; }
                        body {
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 13px;
                            line-height: 1.7;
                            color: #1f2937;
                        }
                        h1, h2, h3 { color: #4f46e5; }
                        table { width: 100%; border-collapse: collapse; }
                        td, th { padding: 8px; border: 1px solid #e2e8f0; }
                        th { background: #4f46e5; color: white; }
                        img { max-width: 200px; }
                    </style>
                </head>
                <body>
                """ + body + """
                </body>
                </html>
                """;
    }
}
