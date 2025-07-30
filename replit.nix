{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.yarn
    pkgs.replitPackages.jest
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [];
  };
}