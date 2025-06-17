<script>
  import { onMount } from "svelte";
  import axios from "axios";

  let selectedConversion = "jpg-to-png";
  let files = [];
  let message = { type: "", text: "" };
  let isLoading = false;
  let progress = 0;
  let currentFileIndex = 0;
  let totalFiles = 0;

  // Rótulos mais concisos
  const conversionTypes = [
    { value: "jpg-to-png", label: "JPG → PNG" },
    { value: "pdf-to-docx", label: "PDF → DOCX" },
    { value: "docx-to-pdf", label: "DOCX → PDF" },
    { value: "txt-to-pdf", label: "TXT → PDF" },
    { value: "audio", label: "Áudio" }, // Simplificado.
  ];

  function handleFileChange(event) {
    files = Array.from(event.target.files);
    message = { type: "", text: "" };
    progress = 0;
    currentFileIndex = 0;
    totalFiles = files.length;
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    files = Array.from(event.dataTransfer.files);
    message = { type: "", text: "" };
    progress = 0;
    currentFileIndex = 0;
    totalFiles = files.length;
  }

  async function convertFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    if (selectedConversion === "audio") {
      const targetAudioFormat = file.type === "audio/mpeg" ? "wav" : "mp3";
      formData.append("targetFormat", targetAudioFormat);
    }

    const response = await axios.post(
      `http://localhost:3000/convert/${selectedConversion}`,
      formData,
      {
        responseType: "blob",
        onUploadProgress: (p) => {
          const fileProgress = Math.round((p.loaded * 100) / p.total);
          progress = (currentFileIndex * 100 + fileProgress) / totalFiles;
        },
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    let filename = `convertido-${Date.now()}-${file.name}`;
    if (selectedConversion === "jpg-to-png")
      filename = filename.replace(/\.[^/.]+$/, ".png");
    else if (selectedConversion === "pdf-to-docx")
      filename = filename.replace(/\.[^/.]+$/, ".docx");
    else if (selectedConversion === "docx-to-pdf")
      filename = filename.replace(/\.[^/.]+$/, ".pdf");
    else if (selectedConversion === "txt-to-pdf")
      filename = filename.replace(/\.[^/.]+$/, ".pdf");
    else if (selectedConversion === "audio") {
      const targetAudioFormat = file.type === "audio/mpeg" ? "wav" : "mp3";
      filename = filename.replace(/\.[^/.]+$/, `.${targetAudioFormat}`);
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleSubmit() {
    if (files.length === 0) {
      message = { type: "error", text: "Selecione pelo menos um arquivo." };
      return;
    }

    isLoading = true;
    message = { type: "", text: "" };
    progress = 0;
    currentFileIndex = 0;
    totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        currentFileIndex = i;
        message = {
          type: "info",
          text: `Convertendo arquivo ${i + 1} de ${files.length}: ${files[i].name}`,
        };
        await convertFile(files[i]);
      }
      message = {
        type: "success",
        text: `Conversão concluída! ${files.length} arquivo(s) processado(s).`,
      };
    } catch (error) {
      console.error("Conversion error:", error);
      message = {
        type: "error",
        text: `Erro na conversão: ${error.response?.data?.details || error.message}`,
      };
    } finally {
      isLoading = false;
      progress = 0;
      files = [];
      currentFileIndex = 0;
      totalFiles = 0;
    }
  }

  onMount(() => {
    // Initialization logic
  });
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
  <div class="card w-full max-w-2xl mx-auto">
    <h1 class="text-center">Konvrt</h1>
    <p class="text-center text-base text-secondary mb-6">
      Conversores de arquivo simples e rápidos.
    </p>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <h2 class="text-lg font-semibold mb-2 text-primary">
          Selecione o tipo de conversão
        </h2>
        <select bind:value={selectedConversion}>
          {#each conversionTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-2 text-primary">
          Selecione os arquivos
        </h2>
        <label
          for="file-upload"
          class="custom-file-upload block"
          on:dragover|preventDefault={handleDragOver}
          on:dragleave|preventDefault={handleDragLeave}
          on:drop|preventDefault={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            on:change={handleFileChange}
          />
          <div class="text-secondary">
            <svg
              class="mx-auto h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a4 4 0 011 7.9M12 13V1a1 1 0 00-1-1h-2a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1zM4 14l4-4m0 0l4 4"
              ></path>
            </svg>
            <p class="mt-1 text-sm">
              Arraste aqui ou <span class="text-accent font-medium">clique</span
              >
            </p>
            {#if files.length > 0}
              <div class="mt-2">
                <p class="text-sm text-primary font-medium">
                  {files.length} arquivo(s) selecionado(s):
                </p>
                <ul class="mt-1 text-xs text-secondary">
                  {#each files as file}
                    <li class="truncate">{file.name}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </label>
      </div>
    </div>

    <div class="mt-6 text-center">
      <button
        on:click={handleSubmit}
        disabled={isLoading || files.length === 0}
        class="w-full"
      >
        {#if isLoading}
          Convertendo... ({currentFileIndex + 1}/{totalFiles})
        {:else}
          Converter {files.length} arquivo(s)
        {/if}
      </button>
    </div>

    {#if isLoading && progress > 0}
      <div class="progress-bar-container mt-4">
        <div class="progress-bar" style="width: {progress}%;"></div>
      </div>
      <p class="text-center text-xs text-secondary mt-1">
        {Math.round(progress)}%
      </p>
    {/if}

    {#if message.text}
      <div class="message-box {message.type} mt-4">{message.text}</div>
    {/if}

    <footer class="mt-8 text-center text-secondary text-xs">
      <p class="mt-1">
        <a
          href="https://github.com/torqu4to/file-converter-app"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent transition-colors duration-200"
          >Repositório no GitHub</a
        >
      </p>
    </footer>
  </div>
</div>

<style lang="postcss">
  /* Styles from app.css will apply */
</style>
