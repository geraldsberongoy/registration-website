import { generateCertificate } from "@/services/certificateService";

// Test page for certificate preview
// Example usage: /test-cert?name=JOHN+DOE
export default async function TestCertPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const name =
    typeof resolvedParams.name === "string"
      ? resolvedParams.name
      : "JUAN DELA CRUZ";

  const base64 = await generateCertificate(name);

  return (
    <div
      style={{ padding: "2rem", backgroundColor: "#111", minHeight: "100vh" }}
    >
      <h1 style={{ color: "white", marginBottom: "1rem" }}>
        Certificate Preview ({name})
      </h1>
      <p style={{ color: "#aaa", marginBottom: "2rem" }}>
        Change name via ?name=John+Doe
      </p>
      <img
        src={`data:image/png;base64,${base64}`}
        alt="Preview"
        style={{ width: "100%", maxWidth: "1000px", border: "1px solid #333" }}
      />
    </div>
  );
}
