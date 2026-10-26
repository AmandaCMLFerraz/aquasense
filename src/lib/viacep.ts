export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchAddressByCep(
  cep: string,
): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data || data.erro) return null;

  return data as ViaCepAddress;
}

export type IbgeCity = {
  label: string;
  value: string;
};

export async function fetchCitiesByState(uf: string): Promise<IbgeCity[]> {
  if (!uf) return [];

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
  );
  if (!response.ok) return [];

  const data: { nome: string }[] = await response.json();
  return data
    .map((city) => ({ label: city.nome, value: city.nome }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
