# Pelimekaniikka v0.1 (Lapland Glory 1995 MVP)

Pelin sykli koostuu vaiheista **Päivä → Yö → Lepo** (DAY/NIGHT/SLEEP). Jokaisessa päivä- tai yövuorossa arvotaan satunnainen tapahtuma pelaajan tilasta ja vaiheesta riippuen. Vuorojen välillä kulkee aikaa (päivälaskuri), ja kun ennalta asetettu aikaraja (esim. 30 päivää) ylittyy, peli päättyy kevät-loppuun. Pelaajan resurssit ovat **money (raha), sanity (järki), energy (vireys), heat (lämpö) ja time (aika)**[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4). Näitä seuraamalla simuloidaan talvinen selviytymiskierros; esimerkkinä päivässä kuluu vuokraa (rahaa) ja pakkanen laskee lämpöä. Pelin lopussa pelaaja kohtaa yhden neljästä mahdollisesta lopetusskenaariosta: **jäätyminen**, **vararikko**, **romahdus** tai **keväänkoitto**.

## Pelitila ja tilastot

Peli pitää kirjaa tilasta GameState\-objektilla. Tässä esimerkissä resurssit ja tila on kuvattu TypeScript-tyyppinä (TS), pohjautuen v0.1-väitteleisiin ja sisäisiin suunnitelmiin[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4)[\[2\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=type%20GameState%20%5C%3D%20,number%3B%20anomaly%3A%20number%3B%20reputation%3A%20number):

type GameState \= {  
  resources: {  
    money: number;    // Rahatilanne  
    sanity: number;   // Pelaajan mielenrauha (pysyy \>0:ssa)  
    energy: number;   // Fyysinen virkeys (mitä enemmän, sitä useampi tapahtuma)  
    heat: number;     // Keho-/lämpötaso (alas 0 → jäätyminen)  
    anomaly: number;  // Lapin Anomalia \-indeksi (sisäisessä laskennassa, passiivinen v0.1:ssa)  
  };  
  time: {  
    day: number;               // Kulunut päivämäärä (1, 2, ...)  
    phase: 'DAY'|'NIGHT'|'SLEEP';  
  };  
  flags: Record\<string, boolean\>; // Tilaliput (esim. tarinatapahtumien avaamiseen)  
  history: string\[\];             // Suoritetut tapahtuma-ID:t (jottei sama toistu)  
};

* **money (raha)**: käytettävissä olevat rahat. Vararikko tapahtuu, jos raha ≤ 0 (tai jokin negatiivinen raja).

* **sanity (järki)**: henkinen kestävyys. Jos järki laskee 0:aan, pelaaja romahtaa psyykkisesti (romahdus-end).

* **energy (vireys)**: fyysinen jaksaminen. Korkea energia mahdollistaa useampia toimenpiteitä; nollassa pelaaja uupuu.

* **heat (lämpö)**: kehon lämpötila/-tila. Talvella lämpö laskee; jos heat ≤ 0, pelaaja jäätyy (freeze-end).

* **time (aika)**: kuluneiden pelipäivien määrä. Kun aikaraja (esim. 30 päivää) täyttyy, peli päättyy kevät-loppuun.

* **anomaly (anomalia)**: sisäinen Anomaly-indeksi (Lapin Anomalia). Se on v0.1:ssa vain passiivinen arvo ilman varsinaista vaikutusta[\[2\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=type%20GameState%20%5C%3D%20,number%3B%20anomaly%3A%20number%3B%20reputation%3A%20number). (Tulevissa versioissa se voi vaikuttaa tapahtumien todennäköisyyksiin.)

Pelitila päivitetään jokaisen tapahtuman ja vaiheenvaihdon yhteydessä. Esimerkiksi yön päättyessä day nousee yhdellä ja vaihe asetetaan DAY (uusi vuorokausi alkaa).

## Sykli: päivä, yö ja lepo

* **Päivä (DAY):** Pelaaja on esimerkiksi virastoissa tai kaupoissa. Päivän alussa laskuri laskee joka viikon lopussa vuokran verran rahaa (esim. –100 *vuokra*). Päivävaiheen lopussa suoritetaan satunnainen **paperwar**\-tapahtuma (byrokratia, virastokäynti) satunnaisesta poolista, riippuen tilasta (esim. flags, resurssit).

* **Yö (NIGHT):** Pelaaja on yöelämässä, kaduilla tai vaikkapa baarissa. Yövaiheen lopussa suoritetaan satunnainen **nightlife**\-/**survival**\-tapahtuma (baarielämää, katutapahtumia tai talviselviytymistä). Tapahtumat voivat palauttaa esimerkiksi pientä määrää lämpöä tai järkeä rahaa vastaan, tai päinvastoin kuluttaa resursseja.

* **Lepo (SLEEP):** Lepovaiheessa pelaaja nukkuu tai lepäilee kotona/kylmäpenkillä. Tämä vaihe palauttaa yleensä energiaa ja suojaa pahimmalta lämpökuolemalta seuraavaan päivään. Vuorokausi vaihtuu, time.day kasvaa yhdellä ja vaiheeksi asetetaan DAY.

Pelin päärunsa toteaa jatkuvasti, onko loppuehto saavutettu (esim. aika täynnä) tai onko jokin Game Over \-ehto sattunut. Pelin peruslooppi on siis: **Day → (tapahtuma) → Night → (tapahtuma) → Sleep → uusi päivä**[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4).

## Tapahtumien rakenne ja data

Tapahtuma (Event) on olio, joka sisältää tunnisteen ja kuvauksen sekä valintavaihtoehdot. Tyypillinen tapahtuma-objekti voisi olla esimerkiksi TypeScript-muodossa seuraavan kaltainen:

type Event \= {  
  id: string;                          // Tapahtuman yksilöivä ID  
  family: 'paperwar'|'nightlife'|'survival';  // Tapahtumaluokka  
  title: string;                       // Tapahtuman otsikko  
  description: string;                 // Tapahtuman kuvaus  
  choices: Choice\[\];                  // Pelaajan valinnat  
};

type Choice \= {  
  text: string;                        // Valinnan kuvaus  
  effects: { \[key in keyof GameState\['resources'\]\]?: number }; // Muutokset resursseihin  
};

Esimerkiksi valinta voi näyttää tältä:

{  
  "text": "Yritä läpäistä portti eteenpäin",  
  "effects": { "energy": \-10, "sanity": \+5 }  
}

Tapahtumissa keskeistä on *valinnat* (choices), joiden seurauksena resurssit voivat nousta tai laskea. Valinta voi vaatia tietyn resurssin (esim. energiaa) ja tuottaa palkkioita tai kustannuksia muille resursseille. Kaikki tapahtumat kerätään data-taulukkoon (JSON tai TS), ja pelisilmukka valitsee niistä sopivan vaiheeseen ja ehdot täyttävän tapauksen[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4)[\[3\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=type%20Event%20%5C%3D%20,%27survival).

### Kymmenen esimerkkitapahtumaa (5 byrokratiaa, 5 yöelämää)

Seuraavassa on kymmenen esimerkkitapahtumaa sekä niiden mahdolliset valinnat ja vaikutukset. Nämä ovat geneerisiä selviytymistilanteita v0.1:n ymmärryksen mukaan – tekstisisältöä voi säätää vastaamaan pelin sävyä.

* **tapahtuma\_1 (paperwar):** *“Kelan jono”* – Pelaaja odottaa Kelan toimistolla.

* *Valinta A:* “Täytän lomakkeen oikein” → vaikutukset: *raha* −10 (matkat, ajan kustannus), *sanity* \+5 (onnistumisen ilo).

* *Valinta B:* “Vittuilen virkailijalle” → vaikutukset: *sanity* \+10 (kiukusta purkautuu), *reputation* ei enää käytössä v0.1, *energia* −5 (turha riitely rasittaa).

* **tapahtuma\_2 (paperwar):** *“Asumistuki-ilmoitus”* – Viranomaiset lähettävät postia ilmoittaakseen asumistuen viivästymisestä.

* *Valinta A:* “Ota laina” → *raha* \+20 (käteistä), *sanity* −5 (huoli takaisinmaksusta).

* *Valinta B:* “Ole rehellinen ja selitä tilanteesi” → *sanity* \+5 (rauhoitut), *time* \+1 (prosessi kestää aikaa), *raha* ei muutu.

* **tapahtuma\_3 (paperwar):** *“Yritykseen pyydetty kela-avustus”* – Pelaajalle tarjotaan mahdollisuus pienyrittäjän tuesta.

* *Valinta A:* “Hakeudu mukaan” → *raha* \+30 (tuki saadaan), *sanity* −10 (byrokratia stressaa), *energy* −10.

* *Valinta B:* “Kieltäydyn” → *sanity* \+5 (vähemmän byrokratiaa), *raha* \+0 (ei muutosta).

* **tapahtuma\_4 (paperwar):** *“Toimiston auttavainen virkailija”* – Virastosta löytyy ystävällinen virkailija, joka haluaa auttaa.

* *Valinta A:* “Kiitä ja ota neuvo” → *sanity* \+10 (positiivinen kokemus), *time* \+1 (tapaaminen venyy), *raha* −0.

* *Valinta B:* “Tee omia toimiasi” → *sanity* \+0, *time* 0 (et säikähdä), *raha* −0.

* **tapahtuma\_5 (paperwar):** *“Verkkopankki häiriö”* – Et voi nostaa rahaa automaatista teknisen häiriön takia.

* *Valinta A:* “Kierrä kaupassa ilman käteistä” → *sanity* −5 (turhautuminen), *energy* −5 (kävele ulos), *raha* 0\.

* *Valinta B:* “Yritä uudelleen myöhemmin” → *time* \+1 (menetät päivän), *sanity* \+0.

* **tapahtuma\_6 (nightlife):** *“Kylmä yö kaduilla”* – Yöllä on tavallista kylmempää.

* *Valinta A:* “Mene baariin lämmittelemään” → *heat* \+20 (tulipesä), *raha* −15 (kerrankin panostat viinaan), *sanity* \+5 (turvattomuus väistyy).

* *Valinta B:* “Jatka kotiin huonolla kelillä” → *heat* −15 (palelu), *sanity* −10 (pelko kasvaa), *energy* −5 (uuvut talvisäässä).

* **tapahtuma\_7 (nightlife):** *“Baari-ilta (Drinkki)”* – Tilanne baarissa.

* *Valinta A:* “Osta olut” → *sanity* \+10 (rentoudut), *money* −5 (olut maksaa), *energy* \+0.

* *Valinta B:* “Pysy vahtimatta hintaa” → *sanity* −5 (liikaa stressiä), *money* \+0 (säästät), *energy* \+0.

* **tapahtuma\_8 (survival):** *“Väliaikainen piilopaikka”* – Löydät suojaa roskalavalta.

* *Valinta A:* “Nuku vaunuvaunussa” → *energy* \+20 (levon vuoksi), *sanity* −10 (epäinhimillinen olosuhde).

* *Valinta B:* “Jatka talviöitä kulkien” → *energy* −10, *heat* −10.

* **tapahtuma\_9 (survival):** *“Käyttämätön atk-kabinetti”* – Törmäät hylättyyn datakeskukseen.

* *Valinta A:* “Käytä generaattoria (polttoaine)” → *heat* \+30 (lämpöä), *money* −10 (polttoaineesta), *sanity* \+5 (innovaatio\!).

* *Valinta B:* “Jätä paikka” → *time* \+1 (etsit toista suojaa), *sanity* −5.

* **tapahtuma\_10 (nightlife):** *“Tarjous vaarallisesta yötyöstä”* – Tuntematon tarjoaa töitä venetsialaisessa hotellissa.

* *Valinta A:* “Ota työ vastaan” → *raha* \+50 (palkka), *sanity* −15 (työ stressaa), *energy* −10.

* *Valinta B:* “Kieltäydy” → *sanity* \+10 (turvallinen ratkaisu), *raha* \+0.

Jokainen tapahtuma on edellä kuvattu JSON/TS-muodossa (kuten Event\-tyyppi). Tapahtumavalintojen seurauksena resurssit (money, sanity, energy, heat) muuttuvat valintojen mukaisesti. (Esimerkissä käytetty reputation\-statti on v0.1:ssa poistettu pois; tilalle voidaan lisätä polku- tai imagostatsit myöhemmässä versiossa.)

## Loppuratkaisut (Endings)

Pelillä on neljä selkeää päätepistettä. Käytämme id:nä englanninkielistä avainsanaa ja listaan liitämme kuvauksen:

* **freeze** – *Title:* **Jäätyminen**. *Trigger:* heat ≤ 0. *Kuvaus:* Pelaaja on paleltunut kuoliaaksi keskellä talvea (lämpö loppuu). Ympäristön kylmyys vie viimeisenkin toivon.

* **bankrupt** – *Title:* **Vararikko**. *Trigger:* money ≤ 0. *Kuvaus:* Pelaaja on menettänyt kaiken rahansa (kaikki rahat kulutettu tai velkaantunut). Lama on voittanut talouden puolella, peli päättyy rahattomuuteen.

* **breakdown** – *Title:* **Romahdus**. *Trigger:* sanity ≤ 0. *Kuvaus:* Pelaaja murtuu psyykkisesti. Liiallinen stressi ja epätoivo vievät mielen, eikä matkaa voi jatkaa. (Tämä kuvaa psyykkistä romahdusta syklin aikana.)

* **spring** – *Title:* **Keväänkoitto**. *Trigger:* *aikaraja täyttyy* (esim. 30 päivää täynnä). *Kuvaus:* Pelaaja on selviytynyt läpi talven ja saavuttaa kevään. Tarinan lopputulema riippuu sodanaikaisten valintojen ja resurssien tasapainosta, mutta peli loppuu uudelle nousulle.

Näistä **freeze**, **bankrupt** ja **breakdown** ovat välittömiä Game Over \-tilanteita, kun vastaava resurssi putoaa kriittisesti alas. *Spring*\-loppu saavutetaan, kun vuorosyklin maksimipituus (esim. kuukausi) täyttyy ja pelaaja on edelleen elossa. Pelikoodi tarkistaa nämä ehdot jokaisen vuorokerran päätteeksi[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4).

---

[\[1\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=,5%20byrokratiaa%2C%205%20y%C3%B6el%C3%A4m%C3%A4%C3%A4) [\[2\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=type%20GameState%20%5C%3D%20,number%3B%20anomaly%3A%20number%3B%20reputation%3A%20number) [\[3\]](file://file_00000000442471f4bc9834ad4502712c#:~:text=type%20Event%20%5C%3D%20,%27survival) pelisuunnitteludokumentti.md

[file://file\_00000000442471f4bc9834ad4502712c](file://file_00000000442471f4bc9834ad4502712c)