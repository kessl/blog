---
title: OSVČ nebo SRO? 2023 edition
tagline: Srovnávací daňová kalkulačka pro rok 2023
description: Rok 2023 přinese navýšení limitů OSVČ pro využití režimu paušální daně. Jak si vede paušální daň ve srovnání s SRO a OSVČ ve standardním režimu?
category: cs
---
Rok 2023 přinese [navýšení příjmových limitů](https://zpravy.aktualne.cz/ekonomika/kalkulacka-pausalni-dan-2023/r~ba0dfdcad05611ec8a24ac1f6b220ee8/){:target="_blank"} OSVČ pro využití režimu paušální daně.
Paušální daň nově spadá do tří pásem podle výše příjmů a výdajového paušálu.
Jak si vede paušální daň ve srovnání s SRO a OSVČ ve standardním režimu?

_Vypočtené hodnoty jsou orientační. Nejsem váš ani ničí jiný daňový poradce._

<noscript>Pro správnou funkci daňové kalkulačky je potřeba mít zapnutý Javascript.</noscript>

<div class="mt-60 sm:flex items-baseline">
  <label for="revenue" class="block w-180 font-bold">Roční příjmy</label>
  <div class="mt-[6px] md:flex items-baseline">
    <input id="revenue" name="revenue" type="number" min="0" step="100000" value="800000" class="w-[181px]">
    <div class="text-xs md:ml-[15px] mt-[6px]">Zadejte vaše celkové roční příjmy</div>
  </div>
</div>
<div class="mt-30 sm:flex items-baseline">
  <label for="expenses" class="block w-180 shrink-0 font-bold">Roční výdaje</label>
  <div class="mt-[6px]">
    <div class="md:flex items-baseline">
      <input id="expenses" name="expenses" type="number" min="0" step="100000" value="400000" class="w-[181px]">
      <div id="expenses_label" class="text-xs md:ml-[15px] mt-[6px]">Zadejte vaše skutečné roční výdaje</div>
    </div>
    <label for="fixed_expenses" class="block mt-[10px] text-sm">
      <input id="fixed_expenses" name="fixed_expenses" type="checkbox">
      Uplatním výdajový paušál
    </label>
  </div>
</div>
<div class="mt-30 sm:mt-[15px] sm:flex items-baseline">
  <span class="block w-180 shrink-0 font-bold">Výdajový paušál</span>
  <div class="leading-[0.875rem]">
    <div class="mt-[10px] w-[255px] flex space-x-30">
      <label for="fixed_expenses_40" class="pl-[1px]">
        <input name="fixed_expenses_rate" id="fixed_expenses_40" type="radio" value="0.4">
        40 %
      </label>
      <label for="fixed_expenses_60" class="pl-[1px]">
        <input name="fixed_expenses_rate" id="fixed_expenses_60" type="radio" value="0.6" checked>
        60 %
      </label>
      <label for="fixed_expenses_80">
        <input name="fixed_expenses_rate" id="fixed_expenses_80" type="radio" value="0.8">
        80 %
      </label>
    </div>
    <br>
    <span class="text-xs">
      Vyberte paušál, který lze uplatnit na 75 % vašich příjmů. Pro výpočet paušální daně v roce 2023 je nutné zvolit paušál, i pokud byste ve standardním režimu uplatnili skutečné výdaje.
    </span>
  </div>
</div>

<div class="my-60 -ml-60 pl-60 -mr-30 md:-mr-90 lg:-mx-90 lg:px-0 overflow-x-auto">
<div class="w-[930px] md:w-[960px] pr-30 md:pr-60 lg:w-[900px] lg:pr-0">
  <div class="row p-0">
    <div></div>
    <div class="font-bold">SRO</div>
    <div>
      <strong>OSVČ</strong>
      <br>
      <span class="relative -top-[6px] text-sm font-normal mb-[6px]">standardní režim</span>
    </div>
    <div>
      <strong>OSVČ</strong>
      <br>
      <span class="relative -top-[6px] text-sm font-normal mb-[6px]">paušální daň 2022</span>
    </div>
    <div>
      <strong>OSVČ</strong>
      <br>
      <span class="relative -top-[6px] text-sm font-normal mb-[6px]">paušální daň 2023</span>
    </div>
  </div>
  <div class="row">
    <div>Příjmy</div>
    <div class="revenue"></div>
    <div class="revenue"></div>
    <div class="revenue" id="fixed_2022_revenue"></div>
    <div class="revenue" id="fixed_2023_revenue"></div>
  </div>
  <div class="row">
    <div>Výdaje</div>
    <div class="expenses"></div>
    <div class="expenses"></div>
    <div class="expenses"></div>
    <div class="expenses"></div>
  </div>
  <div class="row">
    <div>Základ daně</div>
    <div class="company_tax_basis" title="Rozdíl mezi příjmy a výdaji"></div>
    <div class="standard_tax_basis" title="Rozdíl mezi příjmy a výdaji"></div>
    <div class="fixed_2022_tax_basis" title="Rozdíl mezi příjmy a výdaji"></div>
    <div class="fixed_2023_tax_basis" title="Rozdíl mezi příjmy a výdaji"></div>
  </div>
  <div class="row">
    <div>Daň z příjmu právnické osoby</div>
    <div class="company_legal_person_tax" title="19 % ze základu daně"></div>
    <div>&mdash;</div>
    <div>&mdash;</div>
    <div>&mdash;</div>
  </div>
  <div class="row">
    <div>Daň z příjmu fyzické osoby</div>
    <div class="company_natural_person_tax" title="15 % ze základu daně po odečtení daně z příjmu právnické osoby"></div>
    <div class="standard_natural_person_tax" title="15 % ze základu daně"></div>
    <div>&mdash;</div>
    <div>&mdash;</div>
  </div>
  <div class="row">
    <div>Zdravotní pojištění</div>
    <div>&mdash;</div>
    <div class="standard_health_insurance" title="13,5 % z poloviny základu daně; minimálně 2 627 Kč (2022)"></div>
    <div>&mdash;</div>
    <div>&mdash;</div>
  </div>
  <div class="row">
    <div>Sociální pojištění</div>
    <div>&mdash;</div>
    <div class="standard_social_contribution" title="29,2 % z poloviny základu daně; minimálně 2 841 Kč (2022)"></div>
    <div>&mdash;</div>
    <div>&mdash;</div>
  </div>
  <div class="row">
    <div>Paušální daň</div>
    <div>&mdash;</div>
    <div>&mdash;</div>
    <div class="fixed_2022_fixed_tax" title="5 994 Kč měsíčně pro rok 2022"></div>
    <div class="fixed_2023_fixed_tax" title="6 500 Kč, 16 000 Kč nebo 26 000 Kč měsíčně pro rok 2023 v závislosti na příjmech a výdajovém paušálu, který lze aplikovat na 75 % příjmů"></div>
  </div>
  <div class="row font-bold">
    <div>Daně celkem</div>
    <div class="company_total_tax"></div>
    <div class="standard_total_tax"></div>
    <div class="fixed_2022_total_tax"></div>
    <div class="fixed_2023_total_tax"></div>
  </div>
  <div class="row pt-[6px] border-none text-sm text-dark-60">
    <div>Efektivní sazba daně</div>
    <div class="company_effective_tax_rate"></div>
    <div class="standard_effective_tax_rate"></div>
    <div class="fixed_2022_effective_tax_rate"></div>
    <div class="fixed_2023_effective_tax_rate"></div>
  </div>
</div>
</div>

<script src="/assets/taxes.js"></script>

Srovnávací tabulku inspirovala stránka [osvcnebosro.cz](https://osvcnebosro.cz){:target="_blank"}.

Našli jste chybu ve výpočtech? Dejte mi vědět [emailem](mailto:dan@kessl.net) nebo navrhněte vylepšení na [GitHubu](https://github.com/kessl/blog/blob/master/_posts/2022-07-09-osvc-nebo-sro.md?plain=1){:target="_blank"}.
