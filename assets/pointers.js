// https://dwarffortresswiki.org/index.php/DF2014:Name#Dwarven_first_names
const names = ['Aban', 'Adil', 'Alåth', 'Amost', 'Asmel', 'Asob', 'Ast', 'Astesh', 'Asën', 'Athel', 'Atír', 'Atîs', 'Avuz', 'Ber', 'Besmar', 'Bim', 'Bomrek', 'Bëmbul', 'Catten', 'Cerol', 'Cilob', 'Cog', 'Dakost', 'Dastot', 'Datan', 'Deduk', 'Degël', 'Deler', 'Dodók', 'Domas', 'Doren', 'Ducim', 'Dumat', 'Dumed', 'Dîshmab', 'Dôbar', 'Edzul', 'Edëm', 'Endok', 'Eral', 'Erib', 'Erush', 'Eshtân', 'Etur', 'Fath', 'Feb', 'Fikod', 'Geshud', 'Goden', 'Id', 'Iden', 'Ilral', 'Imush', 'Ineth', 'Ingish', 'Inod', 'Kadol', 'Kadôl', 'Kel', 'Kib', 'Kikrost', 'Kivish', 'Kogan', 'Kogsak', 'Kol', 'Kosoth', 'Kulet', 'Kumil', 'Kûbuk', 'Led', 'Libash', 'Likot', 'Limul', 'Litast', 'Logem', 'Lokum', 'Lolor', 'Lorbam', 'Lòr', 'Mafol', 'Mebzuth', 'Medtob', 'Melbil', 'Meng', 'Mestthos', 'Minkot', 'Mistêm', 'Moldath', 'Momuz', 'Monom', 'Mosus', 'Mörul', 'Mûthkat', 'Nil', 'Nish', 'Nomal', 'Obok', 'Oddom', 'Olin', 'Olon', 'Onget', 'Onol', 'Rakust', 'Ral', 'Reg', 'Rigòth', 'Rimtar', 'Rith', 'Rovod', 'Rîsen', 'Sarvesh', 'Sazir', 'Shem', 'Shorast', 'Sibrek', 'Sigun', 'Sodel', 'Solon', 'Stinthäd', 'Stodir', 'Stukos', 'Stâkud', 'Såkzul', 'Tekkud', 'Thob', 'Tholtig', 'Thîkut', 'Tirist', 'Tobul', 'Tosid', 'Tulon', 'Tun', 'Ubbul', 'Udib', 'Udil', 'Unib', 'Urdim', 'Urist', 'Urvad', 'Ushat', 'Ustuth', 'Uvash', 'Uzol', 'Vabôk', 'Vucar', 'Vutok', 'Zan', 'Zaneg', 'Zas', 'Zasit', 'Zefon', 'Zon', 'Zuglar', 'Zulban', 'Zuntîr', 'Zutthan', 'Äs', 'Åblel', 'Èrith', 'Èzum', 'Îton', 'Ïngiz', 'Ïteb', 'Ònul', 'Ùshrir']

const nameTag = (client_id) => {
  const hash = parseInt(client_id, 36)
  return names[hash % names.length]
}

const pointerHtml = (client_id) => `
  <div style="position: absolute; transition: all 100ms linear">
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div style="font: 7px monospace; position: absolute; left: 50%; transform: translateX(-50%)">${nameTag(client_id)}</div>
  </div>
`

export class Pointers {
  pointers = {}

  createPointer(client_id, x, y) {
    const template = document.createElement('template')
    template.innerHTML = pointerHtml(client_id)

    const svg = template.content.firstElementChild
    svg.style.left = `${x * window.innerWidth}px`
    svg.style.top = `${y * window.innerHeight}px`

    document.body.appendChild(svg)
    return svg
  }

  updatePointer(client_id, x, y) {
    if (!x || !y) {
      this.pointers[client_id]?.remove()
      delete this.pointers[client_id]
      return
    }

    this.pointers[client_id] ||= this.createPointer(client_id, x, y)
    this.pointers[client_id].style.left = `${x}px`
    this.pointers[client_id].style.top = `${y}px`
  }
}
