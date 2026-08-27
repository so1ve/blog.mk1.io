{ pkgs, ... }:

{
  packages = with pkgs; [
    vscode-langservers-extracted
    yaml-language-server
  ];
}
