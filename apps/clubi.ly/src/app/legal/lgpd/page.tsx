// app/legal/adendo/page.tsx
import React from "react";
import styles from "./page.module.css";

export default function DataProcessingAddendumPage() {
  return (
    <main className={styles.container}>
      <h1>Adendo de Proteção de Dados – LGPD (Data Processing Addendum)</h1>
      <p><strong>Última atualização:</strong> 4 de agosto de 2025</p>

      <p>
        Este Adendo de Proteção de Dados (<strong>“Adendo”</strong>) é celebrado entre <strong>Clubily Tecnologia Ltda.</strong> (<strong>“Clubily”</strong>, <strong>“Operador”</strong>), inscrita no CNPJ sob nº [•], com sede na Rua [•], nº [•], Bairro [•], CEP [•], Cidade – UF, Brasil, e o <strong>Lojista</strong> identificado nos Termos de Uso da Plataforma Clubily (<strong>“Controlador”</strong>), em conjunto referidos como <strong>“Partes”</strong>.
      </p>
      <p>
        O objetivo deste Adendo é definir as condições de Tratamento de Dados Pessoais na forma da Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (<strong>LGPD</strong>), complementando os <a href="/legal/terms">Termos de Uso</a> e a <a href="/legal/privacy">Política de Privacidade</a>.
      </p>
      <hr />

      <h2>1. Definições</h2>
      <table>
        <thead>
          <tr>
            <th>Termo</th>
            <th>Definição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dados Pessoais</strong></td>
            <td>Informação relacionada a pessoa natural identificada ou identificável tratada no contexto da Plataforma.</td>
          </tr>
          <tr>
            <td><strong>Dados Pessoais Sensíveis</strong></td>
            <td>Dados definidos no art. 5º, II da LGPD (origem racial, convicção religiosa, etc.). A Clubily não deve tratar tais dados, salvo instrução expressa do Controlador e base legal válida.</td>
          </tr>
          <tr>
            <td><strong>Instruções Documentadas</strong></td>
            <td>Orientações escritas fornecidas pelo Controlador ao Operador sobre o Tratamento.</td>
          </tr>
          <tr>
            <td><strong>Suboperador</strong></td>
            <td>Terceiro contratado pelo Operador para auxiliar no Tratamento em nome do Controlador.</td>
          </tr>
        </tbody>
      </table>
      <hr />

      <h2>2. Funções e Responsabilidades</h2>
      <ol>
        <li><strong>Controlador (Lojista)</strong> determina as finalidades e os meios de Tratamento dos Dados Pessoais de seus Clientes.</li>
        <li><strong>Operador (Clubily)</strong> realiza o Tratamento estritamente conforme Instruções Documentadas, exceto quando exigido por lei ou autoridade competente.</li>
        <li>O Operador não utilizará Dados Pessoais para fins próprios sem base legal independente e prévio aviso ao Controlador.</li>
      </ol>
      <hr />

      <h2>3. Objeto do Tratamento</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria de Dados</th>
            <th>Titulares</th>
            <th>Finalidade</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dados cadastrais (nome, e-mail, telefone, CPF)</td>
            <td>Clientes</td>
            <td>Cadastro, autenticação, participação em programas</td>
            <td>Vigência do contrato + prazos legais</td>
          </tr>
          <tr>
            <td>Dados transacionais (valor, loja, data, benefícios)</td>
            <td>Clientes</td>
            <td>Conceder cashback/pontos, emitir relatórios</td>
            <td>Vigência do contrato + 5 anos (art. 12 e 34 da Res. BACEN 4.753)</td>
          </tr>
          <tr>
            <td>Dados de navegação (IP, device)</td>
            <td>Clientes</td>
            <td>Segurança, prevenção a fraude</td>
            <td>Até 6 meses (Marco Civil da Internet)</td>
          </tr>
        </tbody>
      </table>
      <p>O Operador não processará Dados Pessoais fora do escopo acima sem autorização escrita.</p>
      <hr />

      <h2>4. Obrigações do Operador</h2>
      <ol>
        <li><strong>Segurança</strong>: implementar medidas técnicas e administrativas apropriadas (criptografia, controle de acesso, backups, WAF, monitoração 24×7) para proteger Dados Pessoais.</li>
        <li><strong>Confidencialidade</strong>: garantir que empregados e Suboperadores estejam sujeitos a obrigações de sigilo.</li>
        <li><strong>Registro de Operações</strong>: manter registro das atividades de Tratamento conforme art. 37 da LGPD.</li>
        <li><strong>Assistência</strong>: auxiliar o Controlador a atender solicitações de Titulares (art. 18) e a realizar Relatórios de Impacto à Proteção de Dados (art. 38).</li>
        <li><strong>Data Breach</strong>: notificar o Controlador <strong>em até 24 horas</strong> da ciência de incidente que possa acarretar risco ou dano relevante.</li>
        <li><strong>Eliminação/Devolução</strong>: ao término da relação contratual, excluir ou devolver todos os Dados Pessoais, salvo obrigações legais de retenção.</li>
      </ol>
      <hr />

      <h2>5. Suboperadores</h2>
      <ol>
        <li>O Controlador autoriza o uso de Suboperadores listados no <strong>Apêndice A</strong> (ex.: AWS, Google Cloud, Stripe), sujeitos às mesmas obrigações deste Adendo.</li>
        <li>O Operador notificará o Controlador sobre adições ou substituições de Suboperadores com <strong>mínimo 15 dias</strong> de antecedência. Caso o Controlador se oponha, as Partes buscarão solução; na falta de acordo, o Controlador poderá rescindir o contrato sem ônus.</li>
      </ol>
      <hr />

      <h2>6. Transferência Internacional</h2>
      <p>
        O Operador assegura que qualquer transferência internacional ocorrerá somente para países com grau de proteção adequado ou mediante cláusulas contratuais específicas, normas corporativas globais ou outras salvaguardas previstas nos arts. 33–36 da LGPD.
      </p>
      <hr />

      <h2>7. Auditoria</h2>
      <ol>
        <li>O Controlador poderá, uma vez por ano ou em caso de indício relevante de violação, auditar o cumprimento deste Adendo, mediante aviso prévio de <strong>30 dias</strong> e sem impacto indevido às operações do Operador.</li>
        <li>Auditorias podem ser conduzidas por terceiro independente, sujeito a acordo de confidencialidade.</li>
      </ol>
      <hr />

      <h2>8. Responsabilidade e Indenização</h2>
      <ol>
        <li>Cada Parte responderá pelos danos que causar em razão de violação da LGPD, limitada à sua esfera de atuação.</li>
        <li>O Operador indenizará o Controlador por perdas e danos decorrentes de descumprimento comprovado deste Adendo, salvo casos de força maior ou culpa exclusiva do Controlador ou terceiros.</li>
        <li>Nenhuma das Partes será responsável por lucros cessantes ou danos indiretos, exceto em caso de dolo ou culpa grave.</li>
      </ol>
      <hr />

      <h2>9. Vigência e Término</h2>
      <ol>
        <li>Este Adendo vigora enquanto o Operador tratar Dados Pessoais em nome do Controlador.</li>
        <li>Disposições sobre confidencialidade, responsabilidade e auditoria sobrevivem ao término por <strong>5 anos</strong> ou enquanto houver obrigação legal.</li>
      </ol>
      <hr />

      <h2>10. Disposições Gerais</h2>
      <ol>
        <li>Em caso de conflito entre este Adendo e outros instrumentos, prevalecerá o que oferecer maior proteção aos Dados Pessoais.</li>
        <li>Alterações a este Adendo dependerão de acordo escrito entre as Partes.</li>
        <li>Aplicam-se as leis da República Federativa do Brasil; foro da Comarca de <strong>[Cidade-UF]</strong>.</li>
      </ol>
      <hr />

      <h2>Apêndice A – Lista de Suboperadores Autorizados</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>País</th>
            <th>Serviços Prestados</th>
            <th>Salvaguarda</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Amazon Web Services, Inc.</td>
            <td>EUA/Brasil</td>
            <td>Hospedagem e banco de dados</td>
            <td>Cláusulas contratuais padrão + regiões São Paulo/Virginia</td>
          </tr>
          <tr>
            <td>Google Cloud Platform</td>
            <td>EUA/Brasil</td>
            <td>Analytics e BigQuery</td>
            <td>Cláusulas contratuais padrão + regiões São Paulo/Iowa</td>
          </tr>
          <tr>
            <td>Stripe Payments</td>
            <td>EUA</td>
            <td>Processamento de pagamentos</td>
            <td>Cláusulas contratuais padrão</td>
          </tr>
          <tr>
            <td>SendGrid (Twilio)</td>
            <td>EUA</td>
            <td>Envio de e-mail transacional</td>
            <td>Cláusulas contratuais padrão</td>
          </tr>
        </tbody>
      </table>
      <hr />

      <h2>Assinaturas</h2>
      <blockquote>
        <p><strong>Clubily Tecnologia Ltda.</strong><br/>
        [Nome do Representante Legal] — Cargo<br/>
        Data: ____/____/2025</p>
      </blockquote>      
    </main>
  );
}
