export function AddressLookup() {
  return (
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="flex flex-col space-y-1.5 p-6">
        <h2 class="font-semibold leading-none tracking-tight text-lg">Визначити свою чергу за адресою</h2>
      </div>
      <div class="p-6 pt-0">
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2 relative">
              <label for="street-input" class="block text-sm font-medium mb-1.5">
                Вулиця
              </label>
              <input
                type="text"
                id="street-input"
                placeholder="Почніть вводити назву вулиці..."
                autocomplete="off"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              <div id="street-results" class="hidden absolute z-10 w-full mt-2 rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto"></div>
            </div>
            <div class="space-y-2 relative">
              <label for="house-input" class="block text-sm font-medium mb-1.5">
                Будинок
              </label>
              <input
                type="text"
                id="house-input"
                placeholder="Номер будинку..."
                autocomplete="off"
                disabled
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              <div id="house-results" class="hidden absolute z-10 w-full mt-2 rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto"></div>
            </div>
          </div>
          <div id="group-result" class="hidden p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p class="text-sm font-medium"></p>
          </div>
        </div>
      </div>
    </div>
  );
}
