declare module "ip-range-check" {
  export default function check(
    address: string,
    range: string | string[]
  ): boolean;
}
