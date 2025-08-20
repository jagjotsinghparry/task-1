import { useRouter } from "next/router";

import { api } from "../../utils/api";

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.upload.getValidationResult.useQuery(
    { id: id as string },
    { enabled: !!id } // only run when id exists
  );

  if (isLoading) return <p>Loading result...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>No result found.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Validation Result</h1>
      <p>User: {data.user.fullName} ({data.user.email})</p>

      {data.status === "PENDING" && (
        <p style={{ color: "orange" }}>Validation is pending</p>
      )}
      {data.status === "SUCCESS" && (
        <p style={{ color: "green" }}>No mismatches found</p>
      )}
      {data.status === "FAILURE" && (
        <div style={{ color: "red" }}>
          <p>Some fields were found to be incorrect:</p>
          <pre>{JSON.stringify(data.mismatches, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
