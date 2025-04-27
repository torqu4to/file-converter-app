<script>
  let file;
  let downloadLink = "";
  let isLoading = false;
  let error = ""; // Novo: para mensagens de erro

  function handleFileChange(event) {
    file = event.target.files[0];
    downloadLink = ""; // Reseta o link se um novo arquivo for selecionado
    error = ""; // Limpa erros anteriores
  }

  async function convertFile() {
    if (!file) {
      error = "Selecione um arquivo primeiro!!";
      return;
    }

    isLoading = true;
    error = "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "https://konvrt-app.onrender.com/convert/jpg-to-png",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data", // Importante para uploads
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Falha na conversão. Tente outro arquivo.");
      }

      const blob = await response.blob();
      downloadLink = URL.createObjectURL(blob);
    } catch (err) {
      error = err.message; // Exibe mensagem de erro
    } finally {
      isLoading = false;
    }
  }
</script>

<main class="p-8 max-w-md mx-auto">
  <h1 class="text-2xl font-bold mb-4">Conversor de Arquivo</h1>

  <input
    type="file"
    on:change={handleFileChange}
    accept=".jpg,.jpeg"
    class="block w-full mb-4"
  />

  <button
    on:click={convertFile}
    disabled={isLoading || !file}
    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
  >
    {isLoading ? "Convertendo..." : "Converter para PNG"}
  </button>

  <!-- {/* Exibe mensagens de erro */} -->
  {#if error}
    <p class="mt-4 text-red-500">{error}</p>
  {/if}

  <!-- {/* Exibe o link de download após a conversão */} -->
  {#if downloadLink}
    <a
      href={downloadLink}
      download="converted.png"
      class="block mt-4 text-blue-500 hover:underline"
    >
      Baixar arquivo convertido
    </a>
  {/if}
</main>
