// Rodapé grande do Início: unidades, repositório acadêmico, fale conosco e selo e-MEC.
import Image from "next/image";

const REPOSITORIO = [
  "Contrato de Prestação de Serviços Educacionais - Feras",
  "Contrato de Prestação de Serviços Educacionais - Veteranos",
  "Código de Defesa do Consumidor",
  "Política de Privacidade",
  "Manuais Unifacisa",
  "Relatório de Transparência e Igualdade Salarial de Mulheres e Homens - 2º Semestre 2025",
  "Relatório de Transparência e Igualdade Salarial de Mulheres e Homens - 1º Semestre 2025",
  "PPC dos cursos",
  "Portaria 2.864 do MEC",
  "Ver Todos",
];

export default function RodapeInstitucional() {
  const titulo = "mb-2 text-[13px] font-medium text-[#0b3a7c]";
  return (
    <footer className="mx-auto mt-6 max-w-[1280px] px-6 pb-10 text-[10.5px] leading-snug text-[#222] md:pl-[208px]">
      <Image src="/img/logo-unifacisa.png" alt="Unifacisa Centro Universitário" width={179} height={40} className="h-[40px] w-auto" />
      <div className="mt-8 grid gap-6 md:grid-cols-[228px_187px_166px_250px]">
        <div>
          <p className={titulo}>Unidades</p>
          <div className="space-y-2 pl-4">
            <div><p className="font-semibold text-[#0b3a7c]">Unifacisa - Campus Itararé</p>
              <p>Av. Sen. Argemiro de Figueiredo, 1901 Itararé, Campina Grande - PB 58411-020</p>
              <a className="mt-1 block" href="https://maps.google.com/?q=Unifacisa+Itarar%C3%A9+Campina+Grande" target="_blank" rel="noreferrer">Abrir no maps</a></div>
            <div><p className="font-semibold text-[#0b3a7c]">Unifacisa/Esac - Campus Catolé</p>
              <p>R. Luíza Bezerra Mota, 200 Catolé, Campina Grande - PB 58410-410</p>
              <a className="mt-1 block" href="https://maps.google.com/?q=Unifacisa+Catol%C3%A9+Campina+Grande" target="_blank" rel="noreferrer">Abrir no maps</a></div>
          </div>
        </div>
        <div>
          <p className={titulo}>Repositório Acadêmico</p>
          <ul className="space-y-2">{REPOSITORIO.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div>
          <p className={titulo}>Fale Conosco</p>
          <ul className="space-y-2"><li>(83) 2101-8877</li><li>Conversar no WhatsApp</li><li>Contato</li><li>Ouvidoria</li><li>Secretaria Acadêmica</li></ul>
        </div>
        <div><Image src="/img/selo-emec.png" alt="Consulte aqui o cadastro da Instituição no Sistema e-MEC" width={400} height={299} className="h-auto w-[250px]" /></div>
      </div>
      <div className="mt-8 text-[10px]"><p>CESED - Centro de Ensino Superior e Desenvolvimento Ltda.</p><p>© 2026 Todos os direitos reservados.</p><p>CNPJ: 02.108.023/0001-40</p></div>
    </footer>
  );
}
