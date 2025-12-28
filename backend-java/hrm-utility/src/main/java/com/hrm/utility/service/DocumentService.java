package com.hrm.utility.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

public interface DocumentService {
    byte[] generateLeavePdf(Map<String, Object> data);
}

@Service
class DocumentServiceImpl implements DocumentService {

    @Override
    public byte[] generateLeavePdf(Map<String, Object> data) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add colors
            com.itextpdf.kernel.colors.Color headerColor = com.itextpdf.kernel.colors.ColorConstants.DARK_GRAY;
            com.itextpdf.kernel.colors.Color accentColor = new com.itextpdf.kernel.colors.DeviceRgb(19, 127, 236); // Blue
            
            // Header Section with background
            Paragraph header = new Paragraph("LEAVE APPLICATION FORM")
                .setBold()
                .setFontSize(24)
                .setFontColor(com.itextpdf.kernel.colors.ColorConstants.WHITE)
                .setBackgroundColor(accentColor)
                .setPadding(15)
                .setMarginBottom(10);
            document.add(header);

            // Company info
            Paragraph companyInfo = new Paragraph("LeaveFlow - Human Resource Management System")
                .setFontSize(10)
                .setFontColor(headerColor)
                .setMarginBottom(5);
            document.add(companyInfo);

            // Generated date with better formatting
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");
            String formattedDate = java.time.LocalDateTime.now().format(formatter);
            Paragraph dateInfo = new Paragraph("Generated on: " + formattedDate)
                .setFontSize(9)
                .setFontColor(headerColor)
                .setItalic()
                .setMarginBottom(20);
            document.add(dateInfo);

            // Employee Information Section
            Paragraph sectionHeader1 = new Paragraph("Employee Information")
                .setBold()
                .setFontSize(14)
                .setFontColor(accentColor)
                .setMarginBottom(10);
            document.add(sectionHeader1);

            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}));
            infoTable.setWidth(UnitValue.createPercentValue(100));
            infoTable.setMarginBottom(20);

            // Style for label cells
            com.itextpdf.layout.element.Cell labelCell1 = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph("Employee Name:").setBold())
                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(240, 240, 240))
                .setPadding(8);
            infoTable.addCell(labelCell1);
            
            com.itextpdf.layout.element.Cell valueCell1 = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(data.getOrDefault("employeeName", "N/A").toString()))
                .setPadding(8);
            infoTable.addCell(valueCell1);

            document.add(infoTable);

            // Leave Details Section
            Paragraph sectionHeader2 = new Paragraph("Leave Details")
                .setBold()
                .setFontSize(14)
                .setFontColor(accentColor)
                .setMarginBottom(10);
            document.add(sectionHeader2);

            Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}));
            detailsTable.setWidth(UnitValue.createPercentValue(100));

            // Add rows with alternating background
            addTableRow(detailsTable, "Leave Type:", data.getOrDefault("leaveType", "N/A").toString(), true);
            addTableRow(detailsTable, "Start Date:", data.getOrDefault("startDate", "N/A").toString(), false);
            addTableRow(detailsTable, "End Date:", data.getOrDefault("endDate", "N/A").toString(), true);
            addTableRow(detailsTable, "Total Days:", data.getOrDefault("totalDays", "N/A").toString(), false);
            addTableRow(detailsTable, "Reason:", data.getOrDefault("reason", "N/A").toString(), true);

            document.add(detailsTable);

            // Approval Section
            document.add(new Paragraph("\n"));
            Paragraph approvalHeader = new Paragraph("Approval Section")
                .setBold()
                .setFontSize(14)
                .setFontColor(accentColor)
                .setMarginTop(20)
                .setMarginBottom(15);
            document.add(approvalHeader);

            // Signature boxes
            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
            signatureTable.setWidth(UnitValue.createPercentValue(100));

            com.itextpdf.layout.element.Cell employeeSignCell = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph("Employee Signature:\n\n\n_______________________\nDate: _______________"))
                .setPadding(15)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(1));
            signatureTable.addCell(employeeSignCell);

            com.itextpdf.layout.element.Cell managerSignCell = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph("Manager/Approver Signature:\n\n\n_______________________\nDate: _______________"))
                .setPadding(15)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(1));
            signatureTable.addCell(managerSignCell);

            document.add(signatureTable);

            // Footer
            document.add(new Paragraph("\n"));
            Paragraph footer = new Paragraph("This is a system-generated document. No signature is required for electronic submission.")
                .setFontSize(8)
                .setFontColor(headerColor)
                .setItalic()
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginTop(20);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return baos.toByteArray();
    }

    private void addTableRow(Table table, String label, String value, boolean shaded) {
        com.itextpdf.kernel.colors.Color bgColor = shaded ? 
            new com.itextpdf.kernel.colors.DeviceRgb(245, 245, 245) : 
            com.itextpdf.kernel.colors.ColorConstants.WHITE;

        com.itextpdf.layout.element.Cell labelCell = new com.itextpdf.layout.element.Cell()
            .add(new Paragraph(label).setBold())
            .setBackgroundColor(bgColor)
            .setPadding(8)
            .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f));
        table.addCell(labelCell);

        com.itextpdf.layout.element.Cell valueCell = new com.itextpdf.layout.element.Cell()
            .add(new Paragraph(value))
            .setBackgroundColor(bgColor)
            .setPadding(8)
            .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f));
        table.addCell(valueCell);
    }
}
