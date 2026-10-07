package fr.travelestimate.quotes;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class QuoteDocumentService {
    private static final String TEXT_NS = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
    private static final String ODT_MIME = "application/vnd.oasis.opendocument.text";
    private final ClassPathResource template = new ClassPathResource("templates/quote-template.odt");

    public byte[] generate(Quote quote) {
        try (InputStream templateInput = template.getInputStream();
             ZipInputStream source = new ZipInputStream(templateInput);
             ByteArrayOutputStream result = new ByteArrayOutputStream();
             ZipOutputStream target = new ZipOutputStream(result)) {
            ZipEntry entry;
            while ((entry = source.getNextEntry()) != null) {
                byte[] bytes = source.readAllBytes();
                if ("content.xml".equals(entry.getName())) bytes = fillTemplate(bytes, quote);
                ZipEntry outputEntry = new ZipEntry(entry.getName());
                if (entry.getTime() >= 0) outputEntry.setTime(entry.getTime());
                if ("mimetype".equals(entry.getName())) {
                    CRC32 crc = new CRC32();
                    crc.update(bytes);
                    outputEntry.setMethod(ZipEntry.STORED);
                    outputEntry.setSize(bytes.length);
                    outputEntry.setCompressedSize(bytes.length);
                    outputEntry.setCrc(crc.getValue());
                }
                target.putNextEntry(outputEntry);
                target.write(bytes);
                target.closeEntry();
                source.closeEntry();
            }
            target.finish();
            return result.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer le document ODT à partir du modèle", exception);
        }
    }

    private byte[] fillTemplate(byte[] xml, Quote quote) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        Document document = factory.newDocumentBuilder().parse(new InputSource(new ByteArrayInputStream(xml)));

        replaceToken(document, "[Nom du client]", quote.getClientLastName());
        replaceToken(document, "[Prénom du client]", quote.getClientFirstName());
        replaceToken(document, "[Adresse du client]", safe(quote.getClientAddress()));
        replaceToken(document, "[date du devis]", quote.getQuoteDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        replaceToken(document, "[prix de vente total]", euros(totalPrice(quote)));
        replaceServiceLines(document, quote.getLines());

        TransformerFactory transformerFactory = TransformerFactory.newInstance();
        transformerFactory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        var transformer = transformerFactory.newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(document), new StreamResult(output));
        return output.toByteArray();
    }

    private void replaceToken(Document document, String token, String value) {
        NodeList paragraphs = document.getElementsByTagNameNS(TEXT_NS, "p");
        for (int i = 0; i < paragraphs.getLength(); i++) replaceInNode(paragraphs.item(i), token, value);
    }

    private void replaceInNode(Node node, String token, String value) {
        if (node.getNodeType() == Node.TEXT_NODE) {
            String content = node.getNodeValue();
            if (content.contains(token)) node.setNodeValue(content.replace(token, value));
            return;
        }
        Node child = node.getFirstChild();
        while (child != null) {
            Node next = child.getNextSibling();
            replaceInNode(child, token, value);
            child = next;
        }
    }

    private void replaceServiceLines(Document document, List<QuoteLine> lines) {
        NodeList paragraphs = document.getElementsByTagNameNS(TEXT_NS, "p");
        List<Element> slots = new ArrayList<>();
        for (int i = 0; i < paragraphs.getLength(); i++) {
            Element paragraph = (Element) paragraphs.item(i);
            if (paragraph.getTextContent().contains("[prestation")) slots.add(paragraph);
        }
        if (slots.isEmpty()) throw new IllegalStateException("Le modèle ne contient aucun emplacement de prestation");
        Element first = slots.get(0);
        for (int i = 0; i < Math.min(lines.size(), slots.size()); i++) setParagraph(slots.get(i), formatLine(lines.get(i)));
        if (lines.size() < slots.size()) {
            for (int i = slots.size() - 1; i >= lines.size(); i--) slots.get(i).getParentNode().removeChild(slots.get(i));
        } else if (lines.size() > slots.size()) {
            Node parent = slots.get(slots.size() - 1).getParentNode();
            Node insertionPoint = slots.get(slots.size() - 1).getNextSibling();
            for (int i = slots.size(); i < lines.size(); i++) {
                Element paragraph = (Element) first.cloneNode(true);
                setParagraph(paragraph, formatLine(lines.get(i)));
                parent.insertBefore(paragraph, insertionPoint);
            }
        }
    }

    private void setParagraph(Element paragraph, String value) {
        while (paragraph.hasChildNodes()) paragraph.removeChild(paragraph.getFirstChild());
        paragraph.appendChild(paragraph.getOwnerDocument().createTextNode(value));
    }

    private String formatLine(QuoteLine line) {
        StringBuilder text = new StringBuilder(line.getDescription());
        if (line.getPeriod() != null && !line.getPeriod().isBlank()) text.append(" — ").append(line.getPeriod());
        text.append(" — ").append(decimal(line.getQuantity())).append(' ').append(line.getUnit());
        text.append(" : ").append(euros(line.getUnitCost().multiply(line.getQuantity())));
        return text.toString();
    }

    private BigDecimal totalPrice(Quote quote) {
        BigDecimal totalCost = quote.getLines().stream()
            .map(line -> line.getUnitCost().multiply(line.getQuantity()))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, java.math.RoundingMode.HALF_UP);
        return totalCost.multiply(quote.getSalesCoefficient()).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String euros(BigDecimal amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.FRANCE);
        return format.format(amount);
    }
    private String decimal(BigDecimal amount) { return amount.stripTrailingZeros().toPlainString().replace('.', ','); }
    private String safe(String value) { return value == null ? "" : value; }
}
