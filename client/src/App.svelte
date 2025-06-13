<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";

  type ConversionType = {
    label: string;
    accept: string;
    group: string;
  };

  type GroupedConversions = {
    [key: string]: Array<{ key: string } & ConversionType>;
  };

  function groupConversions(
    types: Record<string, ConversionType>,
  ): GroupedConversions {
    return Object.entries(types).reduce((acc, [key, value]) => {
      if (!acc[value.group]) acc[value.group] = [];
      acc[value.group].push({ key, ...value });
      return acc;
    }, {} as GroupedConversions);
  }

  let file: File | null = null;
  let conversionType = "jpg-to-png";
  let isConverting = false;
  let progress = 0;
  let statusMessage = "";
  let errorMessage = "";
  let downloadUrl = "";
  let showSuccess = false;

  const API_URL = "http://localhost:3000";

  const conversionTypes = {
    "jpg-to-png": {
      label: "JPG → PNG",
      accept: "image/jpeg",
      group: "Imagens",
    },
    "pdf-to-docx": {
      label: "PDF → DOCX",
      accept: "application/pdf",
      group: "Documentos",
    },
    "docx-to-pdf": {
      label: "DOCX → PDF",
      accept:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      group: "Documentos",
    },
    "txt-to-pdf": {
      label: "TXT → PDF",
      accept: "text/plain",
      group: "Documentos",
    },
    "mp3-to-wav": {
      label: "MP3 → WAV",
      accept: "audio/mpeg",
      group: "Áudio",
    },
    "wav-to-mp3": {
      label: "WAV → MP3",
      accept: "audio/wav",
      group: "Áudio",
    },
  };

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      file = input.files[0];
      errorMessage = "";
      statusMessage = `Arquivo selecionado: ${file.name}`;
    }
  }

  async function handleConvert() {
    if (!file) {
      errorMessage = "Por favor, selecione um arquivo";
      return;
    }

    isConverting = true;
    progress = 0;
    errorMessage = "";
    statusMessage = "Iniciando conversão...";
    showSuccess = false;

    const formData = new FormData();
    formData.append("file", file);

    try {
      let endpoint = `${API_URL}/convert/`;
      let targetFormat = "";

      switch (conversionType) {
        case "jpg-to-png":
          endpoint += "jpg-to-png";
          break;
        case "pdf-to-docx":
          endpoint += "pdf-to-docx";
          break;
        case "docx-to-pdf":
          endpoint += "docx-to-pdf";
          break;
        case "txt-to-pdf":
          endpoint += "txt-to-pdf";
          break;
        case "mp3-to-wav":
          endpoint += "audio";
          targetFormat = "wav";
          break;
        case "wav-to-mp3":
          endpoint += "audio";
          targetFormat = "mp3";
          break;
        default:
          throw new Error("Tipo de conversão não suportado");
      }

      if (targetFormat) {
        formData.append("targetFormat", targetFormat);
      }

      statusMessage = "Enviando arquivo...";
      progress = 20;

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            progress = 20 + (progressEvent.loaded / progressEvent.total) * 30;
          }
        },
      });

      statusMessage = "Processando arquivo...";
      progress = 50;

      if (response.data.success) {
        statusMessage = "Download iniciado...";
        progress = 80;

        // Simula o download para mostrar progresso
        await new Promise((resolve) => setTimeout(resolve, 1000));

        downloadUrl = response.data.downloadUrl;
        progress = 100;
        statusMessage = "Conversão concluída com sucesso!";
        showSuccess = true;

        // Inicia o download automaticamente
        window.location.href = downloadUrl;
      } else {
        throw new Error(response.data.message || "Erro na conversão");
      }
    } catch (error) {
      console.error("Erro:", error);
      errorMessage =
        error instanceof Error ? error.message : "Erro na conversão";
      statusMessage = "Falha na conversão";
    } finally {
      isConverting = false;
    }
  }

  function resetForm() {
    file = null;
    errorMessage = "";
    statusMessage = "";
    progress = 0;
    showSuccess = false;
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }
</script>

<main
  class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-3xl mx-auto">
    <div class="text-center mb-12">
      <h1
        class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl"
      >
        Conversor de Arquivos
      </h1>
      <p class="mt-5 text-xl text-gray-500">
        Converta seus arquivos facilmente entre diferentes formatos
      </p>
    </div>

    <div
      class="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90"
    >
      <!-- Seleção de Tipo de Conversão -->
      <div class="mb-8">
        <label
          for="conversion-type"
          class="block text-lg font-semibold text-gray-700 mb-3"
        >
          Tipo de Conversão
        </label>
        <select
          id="conversion-type"
          bind:value={conversionType}
          class="block w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          disabled={isConverting}
        >
          {#each Object.entries(groupConversions(conversionTypes)) as [group, files]}
            <optgroup label={group}>
              {#each files as { key, label }}
                <option value={key}>{label}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </div>

      <!-- Upload de Arquivo -->
      <div class="mb-8">
        <label
          for="file-upload"
          class="block text-lg font-semibold text-gray-700 mb-3"
        >
          Arquivo
        </label>
        <div class="flex items-center justify-center w-full">
          <label
            for="file-upload"
            class="flex flex-col w-full h-40 border-4 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 cursor-pointer"
          >
            <div class="flex flex-col items-center justify-center pt-7">
              <svg
                class="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p
                class="pt-4 text-base tracking-wide text-gray-600 group-hover:text-blue-500"
              >
                {file
                  ? file.name
                  : "Arraste um arquivo ou clique para selecionar"}
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Formatos aceitos: {conversionTypes[conversionType].accept}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              class="opacity-0"
              accept={conversionTypes[conversionType].accept}
              on:change={handleFileSelect}
              disabled={isConverting}
            />
          </label>
        </div>
      </div>

      <!-- Barra de Progresso -->
      {#if isConverting}
        <div class="mb-8">
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-in-out"
              style="width: {progress}%"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-3 font-medium">{statusMessage}</p>
        </div>
      {/if}

      <!-- Mensagens de Erro e Sucesso -->
      {#if errorMessage}
        <div
          class="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      {/if}

      {#if showSuccess}
        <div
          class="mb-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">
                Arquivo convertido com sucesso! O download começará
                automaticamente.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Botões -->
      <div class="flex justify-between space-x-4">
        <button
          class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-200 font-medium"
          on:click={resetForm}
          disabled={isConverting}
        >
          Limpar
        </button>
        <button
          class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-200 font-medium"
          on:click={handleConvert}
          disabled={!file || isConverting}
        >
          {isConverting ? "Convertendo..." : "Converter"}
        </button>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
</style>
