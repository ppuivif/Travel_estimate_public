import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';

interface Client { id: number; lastName: string; firstName: string; address: string; email: string; phone: string; }
interface CatalogItem { id: number; serviceType: string; name: string; subtype: string | null; location: string | null; unit: string; unitCost: number; }
interface QuoteLine { description: string; period: string; unit: string; unitCost: number; quantity: number; totalCost: number; }
interface Quote {
  id: number; clientId: number; quoteDate: string; clientLastName: string; clientFirstName: string;
  clientAddress: string; clientEmail: string; clientPhone: string;
  salesCoefficient: number; validated: boolean; lines: QuoteLine[]; totalCost: number; totalPrice: number;
}
type LineField = 'description' | 'period' | 'unit' | 'unitCost' | 'quantity';
interface QuoteLineForm { catalogId: string; description: string; period: string; unit: string; unitCost: string; quantity: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="shell">
      <header><span class="mark">TE</span><div><p class="eyebrow">ESPACE AGENCE</p><h1>Travel Estimate</h1></div>
        @if (authenticated) { <button class="quiet logout" (click)="logout()">Déconnexion</button> }
      </header>
      @if (!authenticated) {
        <section class="login card"><p class="eyebrow">BON RETOUR</p><h2>Connexion</h2><p class="muted">Connectez-vous pour préparer vos devis de voyage.</p>
          <form (submit)="$event.preventDefault(); login()">
            <label>Identifiant<input autocomplete="username" [value]="username" (input)="username = $any($event.target).value" placeholder="test"></label>
            <label>Mot de passe<input type="password" autocomplete="current-password" [value]="password" (input)="password = $any($event.target).value" placeholder="••••••••"></label>
            @if (error) { <p class="error">{{ error }}</p> }
            <button class="primary" [disabled]="pending">{{ pending ? 'Connexion…' : 'Se connecter' }} <span>→</span></button>
          </form><small>Accès de démonstration : test / test</small>
        </section>
      } @else {
        @if (view === 'list') {
          <section class="workspace"><div class="page-heading"><div><p class="eyebrow">VOTRE ACTIVITÉ</p><h2>Devis de voyage</h2><p class="muted">Retrouvez vos devis ou préparez-en un nouveau.</p></div>
            <div class="heading-actions"><button class="quiet" (click)="view = 'catalog'; error = ''">Catalogue <span class="count">{{ catalog.length }}</span></button><button class="quiet" (click)="view = 'clients'; error = ''">Base clients <span class="count">{{ clients.length }}</span></button><button class="primary action" (click)="startCreate()">＋ Nouveau devis</button></div></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            @if (loading) { <div class="card empty">Chargement des devis…</div> }
            @else if (quotes.length === 0) { <div class="card empty"><span class="empty-icon">✦</span><h3>Votre premier devis commence ici</h3><p class="muted">Sélectionnez un client et ajoutez ses prestations.</p><button class="primary action" (click)="startCreate()">Créer un devis</button></div> }
            @else { <div class="quote-list card">@for (quote of quotes; track quote.id) { <button class="quote-row" (click)="openQuote(quote)"><span class="quote-number">DEVIS #{{ quote.id }}</span><span class="quote-client">{{ quote.clientLastName }} {{ quote.clientFirstName }}<small>{{ quote.quoteDate }}</small></span><span class="quote-amount">{{ euros(quote.totalPrice) }}</span><span class="arrow">→</span></button> }</div> }
          </section>
        } @else if (view === 'clients') {
          <section class="workspace"><button class="quiet back" (click)="view = 'list'; error = ''">← Tous les devis</button>
            <div class="page-heading"><div><p class="eyebrow">RÉPERTOIRE</p><h2>Base clients</h2><p class="muted">Les clients enregistrés peuvent être réutilisés dans plusieurs devis.</p></div><button class="primary action" (click)="startClientCreate(false)">＋ Nouveau client</button></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            @if (clientsLoading) { <div class="card empty">Chargement des clients…</div> }
            @else if (!clients.length) { <div class="card empty"><span class="empty-icon">♙</span><h3>Aucun client enregistré</h3><p class="muted">Créez une fiche client pour commencer.</p><button class="primary action" (click)="startClientCreate(false)">Créer un client</button></div> }
            @else { <div class="client-list card">@for (client of clients; track client.id) { <div class="client-row"><div class="client-avatar">{{ initials(client) }}</div><div class="client-info"><strong>{{ client.lastName }} {{ client.firstName }}</strong><small>{{ client.email || client.phone || client.address || 'Coordonnées à compléter' }}</small></div><button class="remove" (click)="deleteClient(client)">Supprimer</button></div> }</div> }
          </section>
        } @else if (view === 'catalog') {
          <section class="workspace"><button class="quiet back" (click)="view = 'list'; error = ''">← Tous les devis</button>
            <div class="page-heading"><div><p class="eyebrow">PRESTATIONS RÉUTILISABLES</p><h2>Catalogue</h2><p class="muted">Les modèles servent à préremplir les prestations des devis.</p></div><button class="primary action" (click)="startCatalogCreate()">＋ Nouvelle prestation</button></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            @if (catalogLoading) { <div class="card empty">Chargement du catalogue…</div> }
            @else if (!catalog.length) { <div class="card empty"><span class="empty-icon">✦</span><h3>Le catalogue est vide</h3><p class="muted">Ajoutez les prestations utilisées régulièrement par votre agence.</p><button class="primary action" (click)="startCatalogCreate()">Créer une prestation</button></div> }
            @else { <div class="catalog-list card">@for (item of catalog; track item.id) { <div class="catalog-row"><div class="catalog-icon">{{ item.serviceType.charAt(0).toUpperCase() }}</div><div class="catalog-description"><span class="catalog-type">{{ item.serviceType }}</span><strong>{{ item.name }}@if (item.subtype) { <span> · {{ item.subtype }}</span> }</strong><small>{{ item.location || 'Localisation libre' }} · {{ item.unit }}</small></div><strong class="catalog-cost">{{ euros(item.unitCost) }}</strong><button class="remove" (click)="deleteCatalogItem(item)">Supprimer</button></div> }</div> }
          </section>
        } @else if (view === 'catalog-create') {
          <section class="workspace narrow"><button class="quiet back" (click)="view = 'catalog'; error = ''">← Catalogue</button>
            <div class="page-heading"><div><p class="eyebrow">NOUVELLE PRESTATION</p><h2>Ajouter au catalogue</h2><p class="muted">Enregistrez un modèle pour le réutiliser dans vos devis.</p></div></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            <form class="form-section card client-form" (submit)="$event.preventDefault(); saveCatalogItem()">
              <div class="form-grid"><label>Type *<input required [value]="catalogType" (input)="catalogType = $any($event.target).value" placeholder="Déplacement"></label>
                <label>Nom de la prestation *<input required [value]="catalogName" (input)="catalogName = $any($event.target).value" placeholder="Transport"></label>
                <label>Sous-type<input [value]="catalogSubtype" (input)="catalogSubtype = $any($event.target).value" placeholder="Train, avion…"></label>
                <label>Localisation<input [value]="catalogLocation" (input)="catalogLocation = $any($event.target).value" placeholder="Paris – Bordeaux"></label>
                <label>Unité *<input required [value]="catalogUnit" (input)="catalogUnit = $any($event.target).value" placeholder="personne, nuitée…"></label>
                <label>Prix de revient unitaire (€) *<input required type="number" min="0" step="0.01" [value]="catalogUnitCost" (input)="catalogUnitCost = $any($event.target).value"></label></div>
              <div class="form-actions"><button type="button" class="quiet" (click)="view = 'catalog'">Annuler</button><button class="primary action" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer la prestation' }}</button></div>
            </form>
          </section>
        } @else if (view === 'client-create') {
          <section class="workspace narrow"><button class="quiet back" (click)="cancelClientCreate()">← {{ returnToQuote ? 'Retour au devis' : 'Base clients' }}</button>
            <div class="page-heading"><div><p class="eyebrow">NOUVELLE FICHE</p><h2>Créer un client</h2><p class="muted">Enregistrez ses coordonnées pour les réutiliser dans vos devis.</p></div></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            <form class="form-section card client-form" (submit)="$event.preventDefault(); saveClient()">
              <div class="form-grid"><label>Nom *<input required [value]="clientLastName" (input)="clientLastName = $any($event.target).value"></label>
                <label>Prénom *<input required [value]="clientFirstName" (input)="clientFirstName = $any($event.target).value"></label>
                <label class="wide">Adresse postale<input [value]="clientAddress" (input)="clientAddress = $any($event.target).value"></label>
                <label>Email<input type="email" [value]="clientEmail" (input)="clientEmail = $any($event.target).value"></label>
                <label>Téléphone<input [value]="clientPhone" (input)="clientPhone = $any($event.target).value"></label></div>
              <div class="form-actions"><button type="button" class="quiet" (click)="cancelClientCreate()">Annuler</button><button class="primary action" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer le client' }}</button></div>
            </form>
          </section>
        } @else if (view === 'create') {
          <section class="workspace"><button class="quiet back" (click)="view = 'list'">← Tous les devis</button>
            <div class="page-heading"><div><p class="eyebrow">NOUVEAU DOCUMENT</p><h2>Créer un devis</h2><p class="muted">Les montants sont calculés automatiquement.</p></div></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            <form class="quote-form" (submit)="$event.preventDefault(); saveQuote()">
              <section class="form-section card"><div class="section-title"><span>01</span><div><h3>Informations du devis</h3><p>Client et date de référence</p></div></div>
                <div class="form-grid"><label class="wide">Client *<select required [value]="selectedClientId" (change)="selectedClientId = $any($event.target).value"><option value="">Choisir un client…</option>@for (client of clients; track client.id) { <option [value]="client.id">{{ client.lastName }} {{ client.firstName }}</option> }</select></label>
                  <div class="wide client-create-prompt"><span>Client absent du répertoire ?</span><button type="button" class="quiet" (click)="startClientCreate(true)">Créer une fiche client →</button></div>
                  <label>Date du devis<input type="date" required [value]="quoteDate" (input)="quoteDate = $any($event.target).value"></label></div>
              </section>
              <section class="form-section card"><div class="section-title"><span>02</span><div><h3>Prestations</h3><p>Détaillez les coûts estimés du voyage</p></div></div>
                @for (line of lines; track $index; let i = $index) { <div class="line-editor"><div class="line-grid">
                  <label class="wide">Modèle du catalogue<select [value]="line.catalogId" (change)="selectCatalogLine(i, $event)"><option value="">Saisie libre</option>@for (item of catalog; track item.id) { <option [value]="item.id">{{ item.serviceType }} · {{ item.name }}{{ item.subtype ? ' · ' + item.subtype : '' }}</option> }</select></label>
                  <label class="wide">Prestation *<input required [value]="line.description" (input)="updateLine(i, 'description', $event)"></label>
                  <label>Période<input [value]="line.period" (input)="updateLine(i, 'period', $event)"></label><label>Unité *<input required [value]="line.unit" (input)="updateLine(i, 'unit', $event)" placeholder="personne, nuitée…"></label>
                  <label>Prix unitaire (€) *<input required type="number" min="0" step="0.01" [value]="line.unitCost" (input)="updateLine(i, 'unitCost', $event)"></label><label>Quantité *<input required type="number" min="0.001" step="0.001" [value]="line.quantity" (input)="updateLine(i, 'quantity', $event)"></label>
                </div><div class="line-bottom"><span>Sous-total</span><strong>{{ euros(lineTotal(line)) }}</strong>@if (lines.length > 1) { <button type="button" class="remove" (click)="removeLine(i)">Retirer</button> }</div></div> }
                <button type="button" class="add-line" (click)="addLine()">＋ Ajouter une prestation</button>
              </section>
              <section class="form-section card totals-section"><div><label>Coefficient de vente *<input class="coefficient" required type="number" min="0.0001" step="0.01" [value]="salesCoefficient" (input)="salesCoefficient = $any($event.target).value"></label><small>Multiplicateur appliqué au prix de revient</small></div>
                <div class="totals"><div><span>Prix de revient total</span><strong>{{ euros(totalCost) }}</strong></div><div class="grand-total"><span>Prix de vente estimé</span><strong>{{ euros(totalPrice) }}</strong></div></div></section>
              <div class="form-actions"><button type="button" class="quiet" (click)="view = 'list'">Annuler</button><button class="primary action" [disabled]="saving || !clients.length">{{ saving ? 'Enregistrement…' : 'Enregistrer le devis' }} <span>→</span></button></div>
            </form>
          </section>
        } @else if (selectedQuote; as quote) {
          <section class="workspace"><button class="quiet back" (click)="view = 'list'">← Tous les devis</button>
            <div class="page-heading"><div><p class="eyebrow">DEVIS #{{ quote.id }}</p><h2>{{ quote.clientLastName }} {{ quote.clientFirstName }}</h2><p class="muted">Créé le {{ quote.quoteDate }}</p></div><div class="detail-actions"><span class="badge">{{ quote.validated ? 'Validé' : 'Brouillon' }}</span><button class="primary action" [disabled]="exporting" (click)="downloadDocument(quote)">{{ exporting ? 'Préparation…' : (quote.validated ? 'Télécharger le modèle ODT' : 'Valider et télécharger le devis') }}</button></div></div>
            @if (error) { <p class="error card notice">{{ error }}</p> }
            <section class="form-section card"><div class="section-title"><span>01</span><div><h3>Client</h3><p>Coordonnées conservées avec ce devis</p></div></div><div class="client-summary"><strong>{{ quote.clientFirstName }} {{ quote.clientLastName }}</strong><span>{{ quote.clientAddress || 'Adresse non renseignée' }}</span><span>{{ quote.clientEmail || '' }} {{ quote.clientPhone || '' }}</span></div></section>
            <section class="form-section card"><div class="section-title"><span>02</span><div><h3>Prestations</h3><p>{{ quote.lines.length }} ligne(s)</p></div></div><div class="detail-lines">@for (line of quote.lines; track $index) { <div class="detail-line"><div><strong>{{ line.description }}</strong><small>{{ line.period || 'Période non précisée' }} · {{ line.quantity }} {{ line.unit }} × {{ euros(line.unitCost) }}</small></div><strong>{{ euros(line.totalCost) }}</strong></div> }</div></section>
            <section class="form-section card detail-totals"><div><span>Prix de revient total</span><strong>{{ euros(quote.totalCost) }}</strong></div><div><span>Coefficient de vente</span><strong>× {{ quote.salesCoefficient }}</strong></div><div class="grand-total"><span>Prix de vente total</span><strong>{{ euros(quote.totalPrice) }}</strong></div></section>
          </section>
        }
      }
      <footer>Une estimation claire, un voyage qui commence bien.</footer>
    </main>`
})
export class AppComponent {
  private readonly http = inject(HttpClient);
  username = ''; password = ''; authenticated = false; error = '';
  pending = false; loading = false; clientsLoading = false; catalogLoading = false; saving = false; exporting = false;
  view: 'list' | 'create' | 'detail' | 'clients' | 'client-create' | 'catalog' | 'catalog-create' = 'list';
  quotes: Quote[] = []; clients: Client[] = []; catalog: CatalogItem[] = []; selectedQuote: Quote | null = null;
  selectedClientId = ''; returnToQuote = false;
  clientLastName = ''; clientFirstName = ''; clientAddress = ''; clientEmail = ''; clientPhone = '';
  quoteDate = new Date().toISOString().slice(0, 10); salesCoefficient = '1.2'; lines: QuoteLineForm[] = [this.emptyLine()];
  catalogType = ''; catalogName = ''; catalogSubtype = ''; catalogLocation = ''; catalogUnit = 'unité'; catalogUnitCost = '';

  login(): void {
    this.pending = true; this.error = '';
    this.http.post<{ username: string }>('/api/auth/login', { username: this.username, password: this.password }).subscribe({
      next: result => { this.username = result.username; this.authenticated = true; this.pending = false; this.loadQuotes(); this.loadClients(); this.loadCatalog(); },
      error: (error: HttpErrorResponse) => { this.error = error.status === 401 ? 'Authentification invalide' : 'API inaccessible. Vérifiez le backend.'; this.pending = false; }
    });
  }
  loadQuotes(): void {
    this.loading = true;
    this.http.get<Quote[]>('/api/quotes').subscribe({ next: result => { this.quotes = result; this.loading = false; }, error: () => { this.error = 'Impossible de charger les devis.'; this.loading = false; } });
  }
  loadClients(): void {
    this.clientsLoading = true;
    this.http.get<Client[]>('/api/clients').subscribe({ next: result => { this.clients = result; this.clientsLoading = false; }, error: () => { this.error = 'Impossible de charger la base clients.'; this.clientsLoading = false; } });
  }
  loadCatalog(): void {
    this.catalogLoading = true;
    this.http.get<CatalogItem[]>('/api/catalog').subscribe({ next: result => { this.catalog = result; this.catalogLoading = false; }, error: () => { this.error = 'Impossible de charger le catalogue.'; this.catalogLoading = false; } });
  }
  startCatalogCreate(): void {
    this.error = ''; this.catalogType = ''; this.catalogName = ''; this.catalogSubtype = '';
    this.catalogLocation = ''; this.catalogUnit = 'unité'; this.catalogUnitCost = ''; this.view = 'catalog-create';
  }
  saveCatalogItem(): void {
    this.saving = true; this.error = '';
    const body = { serviceType: this.catalogType, name: this.catalogName, subtype: this.catalogSubtype, location: this.catalogLocation, unit: this.catalogUnit, unitCost: Number(this.catalogUnitCost) };
    this.http.post<CatalogItem>('/api/catalog', body).subscribe({
      next: item => { this.catalog = [...this.catalog, item].sort((a, b) => a.serviceType.localeCompare(b.serviceType) || a.name.localeCompare(b.name)); this.saving = false; this.view = 'catalog'; },
      error: (error: HttpErrorResponse) => { this.error = error.status === 400 ? 'Vérifiez le type, le nom, l’unité et le prix.' : 'Impossible d’enregistrer la prestation.'; this.saving = false; }
    });
  }
  deleteCatalogItem(item: CatalogItem): void {
    this.error = '';
    this.http.delete(`/api/catalog/${item.id}`).subscribe({ next: () => { this.catalog = this.catalog.filter(value => value.id !== item.id); }, error: () => { this.error = 'Impossible de supprimer cette prestation.'; } });
  }
  selectCatalogLine(index: number, event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const item = this.catalog.find(value => String(value.id) === id);
    if (!item) { this.lines = this.lines.map((line, i) => i === index ? { ...line, catalogId: '', description: '', unit: 'unité', unitCost: '' } : line); return; }
    const description = [item.name, item.subtype, item.location].filter(Boolean).join(' · ');
    this.lines = this.lines.map((line, i) => i === index ? { ...line, catalogId: id, description, unit: item.unit, unitCost: String(item.unitCost) } : line);
  }
  startCreate(): void {
    this.error = ''; this.selectedQuote = null; this.view = 'create'; this.selectedClientId = '';
    this.quoteDate = new Date().toISOString().slice(0, 10); this.salesCoefficient = '1.2'; this.lines = [this.emptyLine()];
  }
  startClientCreate(fromQuote: boolean): void {
    this.error = ''; this.returnToQuote = fromQuote; this.view = 'client-create';
    this.clientLastName = ''; this.clientFirstName = ''; this.clientAddress = ''; this.clientEmail = ''; this.clientPhone = '';
  }
  cancelClientCreate(): void { this.error = ''; this.view = this.returnToQuote ? 'create' : 'clients'; }
  saveClient(): void {
    this.saving = true; this.error = '';
    this.http.post<Client>('/api/clients', { lastName: this.clientLastName, firstName: this.clientFirstName, address: this.clientAddress, email: this.clientEmail, phone: this.clientPhone }).subscribe({
      next: client => {
        this.clients = [...this.clients, client].sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
        this.saving = false;
        if (this.returnToQuote) { this.selectedClientId = String(client.id); this.view = 'create'; }
        else { this.view = 'clients'; }
      },
      error: (error: HttpErrorResponse) => { this.error = error.status === 400 ? 'Le nom et le prénom sont obligatoires.' : 'Impossible d’enregistrer ce client.'; this.saving = false; }
    });
  }
  deleteClient(client: Client): void {
    this.error = '';
    this.http.delete(`/api/clients/${client.id}`).subscribe({
      next: () => { this.clients = this.clients.filter(item => item.id !== client.id); },
      error: (error: HttpErrorResponse) => { this.error = error.status === 409 ? 'Ce client est déjà associé à un devis et ne peut pas être supprimé.' : 'Impossible de supprimer ce client.'; }
    });
  }
  saveQuote(): void {
    this.saving = true; this.error = '';
    const body = { clientId: Number(this.selectedClientId), quoteDate: this.quoteDate, salesCoefficient: Number(this.salesCoefficient), validated: false,
      lines: this.lines.map(line => ({ description: line.description, period: line.period, unit: line.unit, unitCost: Number(line.unitCost), quantity: Number(line.quantity) })) };
    this.http.post<Quote>('/api/quotes', body).subscribe({
      next: quote => { this.quotes = [quote, ...this.quotes]; this.selectedQuote = quote; this.view = 'detail'; this.saving = false; },
      error: (error: HttpErrorResponse) => { this.error = error.status === 400 ? 'Vérifiez les champs obligatoires et les montants saisis.' : 'Impossible d’enregistrer le devis.'; this.saving = false; }
    });
  }
  downloadDocument(quote: Quote): void {
    this.exporting = true;
    this.error = '';
    this.http.post(`/api/quotes/${quote.id}/document`, {}, { responseType: 'blob' }).subscribe({
      next: file => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis-${quote.id}.odt`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        quote.validated = true;
        this.quotes = this.quotes.map(item => item.id === quote.id ? { ...item, validated: true } : item);
        this.exporting = false;
      },
      error: () => { this.error = 'Impossible de générer le document. Vérifiez que le modèle ODT est présent et que le backend est redémarré.'; this.exporting = false; }
    });
  }

  openQuote(quote: Quote): void {
    this.error = '';
    this.http.get<Quote>(`/api/quotes/${quote.id}`).subscribe({ next: result => { this.selectedQuote = result; this.view = 'detail'; }, error: () => { this.error = 'Impossible d’ouvrir ce devis.'; } });
  }
  logout(): void { this.authenticated = false; this.password = ''; this.view = 'list'; }
  addLine(): void { this.lines = [...this.lines, this.emptyLine()]; }
  removeLine(index: number): void { this.lines = this.lines.filter((_, i) => i !== index); }
  updateLine(index: number, field: LineField, event: Event): void { const value = (event.target as HTMLInputElement).value; this.lines = this.lines.map((line, i) => i === index ? { ...line, [field]: value } : line); }
  lineTotal(line: QuoteLineForm): number { return (Number(line.unitCost) || 0) * (Number(line.quantity) || 0); }
  get totalCost(): number { return this.lines.reduce((sum, line) => sum + this.lineTotal(line), 0); }
  get totalPrice(): number { return this.totalCost * (Number(this.salesCoefficient) || 0); }
  euros(value: number): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0); }
  initials(client: Client): string { return `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase(); }
  private emptyLine(): QuoteLineForm { return { catalogId: '', description: '', period: '', unit: 'unité', unitCost: '', quantity: '1' }; }
}
