/**
 * File & Image Upload Service
 * Securely uploads images to Supabase Storage via backend worker endpoint.
 */

export interface UploadResult {
  url: string | null;
  error: string | null;
}

export async function uploadImageFile(
  file: File,
  bucket: "products" | "banners" | "images" = "products"
): Promise<UploadResult> {
  // 1. Basic validation
  if (!file) {
    return { url: null, error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Please select an image file (PNG, JPG, WebP)" };
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: "Image file size must be less than 10MB" };
  }

  try {
    // 2. Try multipart/form-data first
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return { url: data.url, error: null };
      }
    }

    // 3. Fallback: Base64 JSON upload if multipart fails
    return await new Promise<UploadResult>((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const jsonRes = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64,
              filename: file.name,
              contentType: file.type,
              bucket,
            }),
          });

          if (!jsonRes.ok) {
            const errData = await jsonRes.json().catch(() => ({}));
            resolve({ url: null, error: errData.error || "Image upload failed." });
            return;
          }

          const jsonSuccess = await jsonRes.json();
          resolve({ url: jsonSuccess.url, error: null });
        } catch (e: any) {
          resolve({ url: null, error: e?.message || "Failed to upload image." });
        }
      };
      reader.onerror = () => resolve({ url: null, error: "Failed to read file." });
      reader.readAsDataURL(file);
    });
  } catch (err: any) {
    return { url: null, error: err?.message || "Network error uploading image." };
  }
}
