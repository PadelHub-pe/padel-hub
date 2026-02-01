import { Card, CardContent, CardHeader, CardTitle } from "@wifo/ui/card";

interface BasicInfoSectionProps {
  name: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export function BasicInfoSection({
  name,
  phone,
  email,
  website,
  description,
}: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoField label="Nombre del Local" value={name} />
          <InfoField label="Teléfono" value={phone} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoField label="Correo Electrónico" value={email} />
          <InfoField
            label="Sitio Web"
            value={website}
            isLink={!!website}
          />
        </div>
        {description && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Descripción</p>
            <p className="text-sm text-gray-900">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoField({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-900">{value}</p>
        )
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
    </div>
  );
}
