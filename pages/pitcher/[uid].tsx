import { useRouter } from "next/router";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { firestore } from "../../firebase/clientApp";

export default function PitcherPage() {
  const router = useRouter();
  const { uid } = router.query;
  const [data, loading, error] = useDocumentData(
    uid ? doc(firestore, "pitchers", uid as string) : null
  );

  if (loading) return <p>Loading…</p>;
  if (error || !data) return <p>Couldn’t load this pitcher.</p>;

  return (
    <div className="prose mx-auto p-4">
      <h1>{data.fullName}</h1>
      {data.organization && <h3>{data.organization}</h3>}
      <p><strong>My pitch:</strong><br/> {data.pitch}</p>
      <p><strong>Donation per pitch:</strong> ${data.donation}</p>
    </div>
  );
}
