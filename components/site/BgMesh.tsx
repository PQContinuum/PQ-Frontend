export function BgMesh({ orbs = 3 }: { orbs?: number }) {
  return (
    <div className="bg-mesh">
      {orbs >= 1 && <div className="glow-orb orb-1" />}
      {orbs >= 2 && <div className="glow-orb orb-2" />}
      {orbs >= 3 && <div className="glow-orb orb-3" />}
    </div>
  );
}
