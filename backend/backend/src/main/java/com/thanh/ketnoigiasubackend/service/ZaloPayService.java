package com.thanh.ketnoigiasubackend.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ZaloPayService {

    private static final String APP_ID     = "2553";
    private static final String KEY1       = "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL";
    private static final String CREATE_URL = "https://sb-openapi.zalopay.vn/v2/create";
    private static final String QUERY_URL  = "https://sb-openapi.zalopay.vn/v2/query";

    /**
     * Tạo đơn hàng ZaloPay
     */
    public Map<String, Object> createOrder(Long paymentId, long amount,
                                            String studentName, String courseTitle) throws Exception {
        String appTransId = generateAppTransId(paymentId);
        String appUser    = sanitize(studentName);
        String description = String.format(
                "KetNoiGiaSu - %s thanh toan hoc phi [%s] - Ma HD #%d",
                studentName, courseTitle, paymentId);

        String embedData = "{\"redirecturl\":\"http://localhost:5173/student?tab=payments\"}";
        String items = String.format(
                "[{\"itemid\":\"hocphi_%d\",\"itemname\":\"%s\",\"itemprice\":%d,\"itemquantity\":1}]",
                paymentId, escapeJson(courseTitle), amount);

        long timestamp = System.currentTimeMillis();

        // MAC: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
        String rawMac = APP_ID + "|" + appTransId + "|" + appUser + "|" + amount
                + "|" + timestamp + "|" + embedData + "|" + items;
        String mac = hmacSHA256(KEY1, rawMac);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("app_id",       APP_ID);
        params.put("app_trans_id", appTransId);
        params.put("app_user",     appUser);
        params.put("app_time",     String.valueOf(timestamp));
        params.put("amount",       String.valueOf(amount));
        params.put("item",         items);
        params.put("embed_data",   embedData);
        params.put("description",  description);
        params.put("bank_code",    "zalopayapp");
        params.put("mac",          mac);

        String responseBody = postForm(CREATE_URL, params);
        Map<String, Object> result = parseJson(responseBody);
        result.put("app_trans_id", appTransId);
        return result;
    }

    /**
     * Kiểm tra trạng thái đơn hàng (polling)
     * return_code: 1 = thành công, 2 = thất bại, 3 = đang xử lý
     */
    public Map<String, Object> queryOrder(String appTransId) throws Exception {
        String rawMac = APP_ID + "|" + appTransId + "|" + KEY1;
        String mac = hmacSHA256(KEY1, rawMac);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("app_id",       APP_ID);
        params.put("app_trans_id", appTransId);
        params.put("mac",          mac);

        String responseBody = postForm(QUERY_URL, params);
        return parseJson(responseBody);
    }

    // ===== HELPERS =====

    private String generateAppTransId(Long paymentId) {
        String date = new SimpleDateFormat("yyMMdd").format(new Date());
        return date + "_" + paymentId + "_" + (System.currentTimeMillis() % 100000);
    }

    private String hmacSHA256(String key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private String postForm(String urlStr, Map<String, String> params) throws Exception {
        StringBuilder form = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (form.length() > 0) form.append("&");
            form.append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8))
                .append("=")
                .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
        }
        byte[] body = form.toString().getBytes(StandardCharsets.UTF_8);

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setRequestProperty("Content-Length", String.valueOf(body.length));
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body);
        }

        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) response.append(line);
        }
        return response.toString();
    }

    /** Parse JSON đơn giản không cần thư viện */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        Map<String, Object> map = new LinkedHashMap<>();
        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}"))   json = json.substring(0, json.length() - 1);

        // Tách các cặp key:value đơn giản (không nested)
        int i = 0;
        while (i < json.length()) {
            // Tìm key
            int ks = json.indexOf('"', i);
            if (ks < 0) break;
            int ke = json.indexOf('"', ks + 1);
            if (ke < 0) break;
            String key = json.substring(ks + 1, ke);
            int colon = json.indexOf(':', ke);
            if (colon < 0) break;
            int vs = colon + 1;
            while (vs < json.length() && json.charAt(vs) == ' ') vs++;

            Object value;
            if (vs < json.length() && json.charAt(vs) == '"') {
                // String value
                int ve = json.indexOf('"', vs + 1);
                while (ve > 0 && json.charAt(ve - 1) == '\\') ve = json.indexOf('"', ve + 1);
                value = ve > 0 ? json.substring(vs + 1, ve) : "";
                i = ve + 1;
            } else {
                // Number / boolean / null
                int ve = json.indexOf(',', vs);
                if (ve < 0) ve = json.length();
                String raw = json.substring(vs, ve).trim();
                try { value = Long.parseLong(raw); }
                catch (NumberFormatException e) {
                    try { value = Double.parseDouble(raw); }
                    catch (NumberFormatException e2) { value = raw; }
                }
                i = ve + 1;
            }
            map.put(key, value);
        }
        return map;
    }

    private String sanitize(String s) {
        return s == null ? "user" : s.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
    }

    private String escapeJson(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
