// app/legal/privacy/page.tsx
import React from "react";
import styles from "./page.module.css";

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.container}>
      <h1>Política de Privacidade</h1>
      <p><strong>Última atualização:</strong> 4 de agosto de 2025</p>

      <p>
        Esta Política de Privacidade (<strong>“Política”</strong>) descreve como a <strong>Clubily</strong> (<strong>“Empresa”</strong>, <strong>“nós”</strong>, <strong>“nosso”</strong>), pessoa jurídica de direito privado inscrita no CNPJ sob nº [•], com sede na Rua [•], nº [•], Bairro [•], CEP [•], Cidade – UF, coleta, usa, compartilha e protege os dados pessoais de usuários lojistas (<strong>“Lojistas”</strong>) e consumidores finais (<strong>“Clientes”</strong>) que utilizam a nossa plataforma de <strong>programas de cashback, pontos e cartão fidelidade</strong> (<strong>“Plataforma”</strong>).
      </p>
      <p>
        Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais – <strong>LGPD</strong> (Lei nº 13.709/2018) e demais normas aplicáveis. Ao utilizar a Plataforma, você declara ter lido, compreendido e concordado com os termos aqui previstos.
      </p>
      <hr />

      <h2>1. Definições</h2>
      <table>
        <thead>
          <tr>
            <th>Termo</th>
            <th>Significado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dados Pessoais</strong></td>
            <td>Qualquer informação relacionada a pessoa natural identificada ou identificável, conforme art. 5º, I da LGPD.</td>
          </tr>
          <tr>
            <td><strong>Tratamento</strong></td>
            <td>Toda operação realizada com Dados Pessoais (coleta, utilização, acesso, armazenamento, eliminação etc.).</td>
          </tr>
          <tr>
            <td><strong>Titular</strong></td>
            <td>Pessoa natural a quem se referem os Dados Pessoais.</td>
          </tr>
          <tr>
            <td><strong>Controlador</strong></td>
            <td>Pessoa natural ou jurídica a quem competem as decisões sobre o Tratamento de Dados Pessoais.</td>
          </tr>
          <tr>
            <td><strong>Operador</strong></td>
            <td>Pessoa natural ou jurídica que realiza o Tratamento de Dados Pessoais em nome do Controlador.</td>
          </tr>
          <tr>
            <td><strong>Encarregado (DPO)</strong></td>
            <td>Pessoa indicada pelo Controlador para atuar como canal de comunicação entre o Controlador, os Titulares e a ANPD.</td>
          </tr>
        </tbody>
      </table>
      <hr />

      <h2>2. Quem é o Controlador?</h2>
      <ul>
        <li>
          Quando a <strong>Clubily</strong> define finalidades e meios de Tratamento (p. ex., criação e operação da Plataforma, análise de dados agregados, marketing próprio), atua como <strong>Controlador</strong>.
        </li>
        <li>
          Quando os Lojistas utilizam a Plataforma para administrar programas de fidelidade, os Lojistas são <strong>Controladores</strong> dos dados dos seus Clientes, e a <strong>Clubily</strong> atua como <strong>Operador</strong>, tratando os Dados Pessoais conforme instruções contratuais.
        </li>
      </ul>
      <hr />

      <h2>3. Dados Pessoais que Coletamos</h2>

      <h3>3.1. Dados fornecidos pelo <strong>Lojista</strong></h3>
      <ul>
        <li>Nome/Razão Social, CNPJ, inscrição estadual/municipal;</li>
        <li>Nome e dados de contato do responsável (e-mail, telefone, CPF);</li>
        <li>Endereço comercial, ramo de atividade;</li>
        <li>Informações de faturamento, dados bancários e histórico de pagamentos;</li>
        <li>Configurações de programa (regras de cashback, pontos, carimbos etc.).</li>
      </ul>

      <h3>3.2. Dados fornecidos pelo <strong>Cliente</strong></h3>
      <ul>
        <li>Nome completo, e-mail, número de telefone, CPF;</li>
        <li>Data de nascimento e gênero (opcional);</li>
        <li>Informações de login (usuário, senha criptografada);</li>
        <li>Imagem de perfil (opcional);</li>
        <li>Preferências de comunicação e marketing.</li>
      </ul>

      <h3>3.3. Dados coletados automaticamente</h3>
      <ul>
        <li>Endereço IP, tipo e versão do navegador, sistema operacional;</li>
        <li>Data, hora e duração de acesso;</li>
        <li>Registros de transações (valor da compra, estabelecimento, quantidade de pontos, cashback, carimbos recebidos);</li>
        <li>Dados de geolocalização (quando o Titular consente, para exibir Lojas próximas);</li>
        <li>Cookies e tecnologias semelhantes (pixels, localStorage). Consulte a <a href="/legal/cookies">Política de Cookies</a>.</li>
      </ul>

      <h3>3.4. Dados obtidos de terceiros</h3>
      <ul>
        <li>Provedores de pagamento (status da transação, chargeback);</li>
        <li>Serviços de verificação de identidade ou bureaus de crédito (score de risco, fraude) quando permitido em lei;</li>
        <li>Parceiros de marketing (leads qualificados, preferências de consumo).</li>
      </ul>
      <hr />

      <h2>4. Finalidades do Tratamento</h2>
      <ol>
        <li><strong>Prestação dos serviços</strong>: viabilizar cadastro, autenticação, gestão de programas de fidelidade e resgate de recompensas;</li>
        <li><strong>Operação financeira</strong>: processar pagamentos, conceder cashback, emitir notas fiscais;</li>
        <li><strong>Suporte ao usuário</strong>: responder dúvidas, reclamações e solicitações;</li>
        <li><strong>Melhoria da Plataforma</strong>: medir desempenho, testar funcionalidades, realizar análises estatísticas e de uso;</li>
        <li><strong>Marketing</strong>: enviar comunicações promocionais, newsletters e notificações (com base em consentimento ou interesse legítimo);</li>
        <li><strong>Prevenção a fraudes</strong>: monitorar atividades suspeitas e garantir segurança das transações;</li>
        <li><strong>Cumprimento de obrigações legais/regulatórias</strong>: guarda de registros, relatórios à Receita Federal, ANPD, Banco Central e outras autoridades;</li>
        <li><strong>Defesa de direitos</strong>: exercer direitos em processos judiciais, administrativos ou arbitrais.</li>
      </ol>
      <hr />

      <h2>5. Bases Legais</h2>
      <p>
        O Tratamento de Dados Pessoais ocorre com fundamento em uma ou mais das bases legais previstas no art. 7º da LGPD, a depender do contexto:
      </p>
      <ul>
        <li><strong>Execução de contrato</strong> (art. 7º, V) – prestação dos serviços da Plataforma;</li>
        <li><strong>Cumprimento de obrigação legal ou regulatória</strong> (art. 7º, II) – obrigações fiscais, consumidor, prevenção à lavagem de dinheiro;</li>
        <li><strong>Exercício regular de direitos</strong> (art. 7º, VI);</li>
        <li><strong>Interesse legítimo</strong> (art. 7º, IX) – melhoria da experiência, prevenção a fraudes;</li>
        <li><strong>Consentimento</strong> (art. 7º, I) – comunicações de marketing, uso de geolocalização, cookies não essenciais.</li>
      </ul>
      <hr />

      <h2>6. Compartilhamento de Dados</h2>
      <p>Podemos compartilhar Dados Pessoais com:</p>
      <ul>
        <li><strong>Lojistas</strong> (quando o Cliente interage com seus programas);</li>
        <li><strong>Prestadores de serviços</strong> (hospedagem em nuvem, processamento de pagamentos, e-mail marketing, atendimento ao cliente), sob contratos de confidencialidade;</li>
        <li><strong>Parceiros de integração</strong> (gateways de pagamento, sistemas de ERP, ferramentas de BI) a pedido do Lojista;</li>
        <li><strong>Autoridades</strong> judiciais, policiais ou governamentais, para cumprir obrigação legal ou ordem judicial;</li>
        <li><strong>Potenciais investidores ou adquirentes</strong> em operações societárias, garantida a anonimização sempre que possível.</li>
      </ul>
      <p><em>Não vendemos Dados Pessoais.</em></p>
      <hr />

      <h2>7. Cookies e Tecnologias Semelhantes</h2>
      <p>
        Utilizamos cookies para:
      </p>
      <ul>
        <li>Manter sessões autenticadas;</li>
        <li>Lembrar preferências;</li>
        <li>Medir audiência e desempenho;</li>
        <li>Veicular publicidade segmentada (quando autorizado).</li>
      </ul>
      <p>
        O Titular pode gerenciar cookies nas configurações do navegador, porém certas funcionalidades podem ser afetadas.
      </p>
      <hr />

      <h2>8. Armazenamento e Segurança</h2>
      <p>
        Empregamos medidas técnicas e administrativas para proteger Dados Pessoais contra acessos não autorizados, destruição, perda, alteração ou divulgação, tais como:
      </p>
      <ul>
        <li>Criptografia em repouso e em trânsito (TLS 1.3, AES-256);</li>
        <li>Gerenciamento de chaves e controle de acesso baseado em função (RBAC);</li>
        <li>Backups diários e redundância geográfica;</li>
        <li>Monitoramento 24×7, firewall de aplicação (WAF) e anti-DDoS;</li>
        <li>Auditorias externas de segurança e testes de penetração.</li>
      </ul>
      <p>
        Caso ocorram incidentes, notificaremos os Titulares e a ANPD conforme exigido em lei.
      </p>
      <hr />

      <h2>9. Transferência Internacional de Dados</h2>
      <p>
        Alguns serviços de nuvem podem estar localizados no exterior. Nessas hipóteses, garantimos que os dados serão tratados de acordo com padrões adequados de proteção, nos termos dos arts. 33–36 da LGPD, por meio de cláusulas contratuais específicas, selos de privacidade ou certificados reconhecidos.
      </p>
      <hr />

      <h2>10. Direitos dos Titulares</h2>
      <p>O Titular pode, mediante requisição:</p>
      <ol>
        <li>Confirmar a existência de Tratamento;</li>
        <li>Acessar seus Dados Pessoais;</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimizar, bloquear ou eliminar dados desnecessários, excessivos ou tratados em desconformidade;</li>
        <li>Portar dados a outro fornecedor de serviço;</li>
        <li>Eliminar dados tratados com base no consentimento;</li>
        <li>Obter informação sobre compartilhamento;</li>
        <li>Revogar consentimento;</li>
        <li>Solicitar revisão de decisões automatizadas.</li>
      </ol>
      <p>
        Para exercer esses direitos, envie requisição para <a href="mailto:help@clubi.ly">help@clubi.ly</a>. Responderemos em até 15 dias, conforme art. 18, §4º da LGPD.
      </p>
      <hr />

      <h2>11. Retenção de Dados</h2>
      <p>
        Mantemos Dados Pessoais somente pelo período necessário às finalidades descritas ou conforme exigido por lei (p. ex., obrigações fiscais por 5 anos; informações de transações financeiras por 10 anos, art. 34 da Circular BACEN 3.680/2013).
      </p>
      <hr />

      <h2>12. Dados de Crianças e Adolescentes</h2>
      <p>
        A Plataforma não se destina a menores de 13 anos. Caso seja necessário coletar dados de adolescentes (13–18 anos), solicitaremos consentimento específico de pelo menos um dos pais ou responsável, nos termos do art. 14 da LGPD.
      </p>
      <hr />

      <h2>13. Alterações desta Política</h2>
      <p>
        Poderemos alterar esta Política a qualquer momento para refletir mudanças legislativas ou operacionais. Em caso de alterações substantivas, notificaremos por meio do e-mail cadastrado ou aviso na Plataforma. A versão vigente será sempre a mais recente, identificada pela data no topo.
      </p>
      <hr />

      <h2>14. Contato do Encarregado (DPO)</h2>
      <blockquote>
        <p><strong>Gabriel Machado</strong><br />
        E-mail: <a href="mailto:dpo@clubi.ly">dpo@clubi.ly</a><br />
        Endereço: Rua [•], nº [•], Bairro [•], CEP [•], Cidade – UF, Brasil.</p>
      </blockquote>
      <hr />

      <h2>15. Disposições Gerais</h2>
      <ul>
        <li>Caso alguma disposição desta Política seja considerada inválida, as demais permanecerão em pleno vigor;</li>
        <li>Esta Política é regida pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de [cidade-UF], salvo outra previsão legal.</li>
      </ul>
      <p><em>Ao utilizar a Plataforma, você confirma que leu e compreendeu esta Política de Privacidade.</em></p>
    </main>
  );
}
