import { useState } from "react";
import { useRouter } from "next/router";

import { api } from "../utils/api";

export default function FormPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  const validateMutation = api.validate.validateUpload.useMutation();

  const uploadMutation = api.upload.uploadFormDataAndCV.useMutation({
    onSuccess: (data) => {
      // Fire validation in background, then redirect immediately
      validateMutation.mutate({ id: data.id });
      router.push(`/result/${data.id}`);
    },
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:application/pdf;base64," prefix
        const base64String = result.split(",")[1];
        if (base64String) resolve(base64String);
        else reject("Error 1");
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!file) {
      alert("Please upload a PDF file.");
      return;
    }

    const base64File = await fileToBase64(file);

    uploadMutation.mutate({
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      skills: formData.get("skills") as string,
      experience: formData.get("experience") as string,
      file: base64File,
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload Your CV</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="fullName" placeholder="Full Name" required />
        <br />
        <input type="email" name="email" placeholder="Email" required />
        <br />
        <input type="tel" name="phone" placeholder="Phone" />
        <br />
        <textarea name="skills" placeholder="Skills (comma separated)" />
        <br />
        <textarea name="experience" placeholder="Experience" />
        <br />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <br />
        <button type="submit" disabled={uploadMutation.isLoading}>
          {uploadMutation.isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}