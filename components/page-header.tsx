type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
    </div>
  );
}
