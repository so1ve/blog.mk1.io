{ inputs, pkgs, ... }:

{
  cachix.pull = [ "so1ve" ];

  packages = [
    inputs.inkcairn.packages.${pkgs.stdenv.system}.inkcairn
    pkgs.vscode-langservers-extracted
    pkgs.yaml-language-server
  ];
}
