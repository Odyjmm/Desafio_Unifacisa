// Faixa azul-marinho no fim das telas Buscar, Indicadores e Cadastro (igual ao Figma).
export default function RodapeBarra({ direita = "Centro Universitário UNIFACISA · Campina Grande, PB" }: { direita?: string }) {
  return (
    <footer className="mt-auto bg-marinho text-[13px] min-h-[71px] flex items-center text-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-2 px-6 py-5">
        <p><b>Desafio Unifacisa</b> Banco de Demandas Local Multissetorial · NUPEX</p>
        <p>{direita}</p>
      </div>
    </footer>
  );
}
